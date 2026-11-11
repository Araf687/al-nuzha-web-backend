import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { Invoice, PaymentStatus } from '../invoices/entities/invoice.entity';
import { RequestStatus, ServiceRequest } from '../service-requests/entities/service-request.entity';
import * as bcrypt from 'bcrypt';

// Everything about a customer that may go out in a response — never the password hash
const CUSTOMER_FIELDS = [
  'id', 'name', 'phone', 'email', 'address', 'lat', 'lng', 'isRegistered', 'createdAt',
] as const;

// Page size for the customer list; a client asking for more is capped
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export interface CustomerQuery {
  // Matches name, phone, email or address
  search?: string;
  // 'with' keeps only customers who owe money, 'cleared' only those who do not
  due?: 'with' | 'cleared';
  page?: number;
  limit?: number;
}

function money(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

@Injectable()
export class CustomersService {
  constructor(@InjectRepository(Customer) private repo: Repository<Customer>) {}

  /**
   * One page of customers, each carrying `jobCount` and `totalDue`: what is
   * still owed across their unpaid and partly paid invoices (total minus
   * whatever was already paid), or 0 when they owe nothing.
   *
   * `summary` counts the whole result of the search, not just this page, so
   * the caller can show "with dues" / "fully paid" tallies beside the list.
   */
  async findAll(filters: CustomerQuery = {}) {
    const page = Math.max(1, Math.trunc(Number(filters.page) || 1));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(Number(filters.limit) || DEFAULT_PAGE_SIZE)));

    const [{ entities, raw }, totals] = await Promise.all([
      this.customerQuery(filters)
        .select(CUSTOMER_FIELDS.map((f) => `c.${f}`))
        .addSelect('COALESCE(d.due, 0)', 'totalDue')
        .addSelect('COALESCE(j.jobs, 0)', 'jobCount')
        .orderBy('c.createdAt', 'DESC')
        // offset/limit rather than skip/take: the joins are one row per
        // customer, and skip/take would wrap this in a DISTINCT subquery and
        // drop the raw columns the rows are paired with below
        .offset((page - 1) * limit)
        .limit(limit)
        .getRawAndEntities<{ totalDue: string; jobCount: string }>(),

      // Tallies ignore the due filter, so every chip can show its own count
      this.customerQuery({ search: filters.search })
        .select('COUNT(*)', 'customers')
        .addSelect('COUNT(*) FILTER (WHERE COALESCE(d.due, 0) > 0)', 'withDue')
        .addSelect('COALESCE(SUM(COALESCE(d.due, 0)), 0)', 'totalDue')
        .getRawOne<{ customers: string; withDue: string; totalDue: string }>(),
    ]);

    const customers = Number(totals?.customers ?? 0);
    const withDue = Number(totals?.withDue ?? 0);
    const total =
      filters.due === 'with' ? withDue : filters.due === 'cleared' ? customers - withDue : customers;

    return {
      data: entities.map((c, i) => ({
        ...c,
        jobCount: Number(raw[i]?.jobCount ?? 0),
        totalDue: money(raw[i]?.totalDue),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary: {
        customers,
        withDue,
        cleared: customers - withDue,
        totalDue: money(totals?.totalDue),
      },
    };
  }

  /**
   * Customers with their open balance and job count attached, filtered but not
   * yet paged — shared by the list and its tallies.
   */
  private customerQuery({ search, due }: CustomerQuery) {
    const qb = this.repo
      .createQueryBuilder('c')
      // Both totals are grouped in Postgres, so no invoice or job row is loaded
      .leftJoin(
        `(SELECT i."customerId" AS cid,
                 COALESCE(SUM(GREATEST(i.total - i."advanceAmount", 0)), 0) AS due
            FROM invoices i
           WHERE i."paymentStatus" <> '${PaymentStatus.PAID}'
           GROUP BY i."customerId")`,
        'd',
        'd.cid = c.id',
      )
      .leftJoin(
        `(SELECT sr."customerId" AS cid, COUNT(*) AS jobs
            FROM service_requests sr
           GROUP BY sr."customerId")`,
        'j',
        'j.cid = c.id',
      );

    const q = search?.trim();
    if (q) {
      qb.andWhere(
        '(c.name ILIKE :q OR c.phone ILIKE :q OR c.email ILIKE :q OR c.address ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    if (due === 'with') qb.andWhere('COALESCE(d.due, 0) > 0');
    if (due === 'cleared') qb.andWhere('COALESCE(d.due, 0) = 0');

    return qb;
  }

  /** The row itself — for the methods that need to save it back. */
  private async getEntity(id: string) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  /**
   * One customer with their whole job history: every service request newest
   * first, each with the technician who handled it and its invoice, plus
   * counts and money totals over all of them.
   */
  async findOne(id: string) {
    const customer = await this.repo.findOne({ where: { id }, select: [...CUSTOMER_FIELDS] });
    if (!customer) throw new NotFoundException('Customer not found');

    const requests = await this.repo.manager.find(ServiceRequest, {
      where: { customer: { id } },
      relations: { assignedTechnician: true, jobReport: { invoice: true } },
      select: {
        id: true, jobRef: true, serviceType: true, equipmentType: true, equipmentBrand: true,
        problemDescription: true, address: true, status: true, isRecurring: true,
        createdAt: true, scheduledAt: true,
        assignedTechnician: { id: true, name: true, phone: true },
        jobReport: {
          id: true, completedAt: true, grandTotal: true,
          invoice: {
            id: true, invoiceRef: true, total: true, advanceAmount: true,
            paymentStatus: true, paymentMethod: true, issuedAt: true, paidAt: true,
          },
        },
      },
      order: { createdAt: 'DESC' },
    });

    const jobs = requests.map((r) => {
      const inv = r.jobReport?.invoice ?? null;
      return {
        id: r.id,
        jobRef: r.jobRef,
        serviceType: r.serviceType,
        equipmentType: r.equipmentType ?? null,
        equipmentBrand: r.equipmentBrand ?? null,
        problemDescription: r.problemDescription ?? null,
        address: r.address ?? null,
        status: r.status,
        isRecurring: r.isRecurring,
        createdAt: r.createdAt,
        scheduledAt: r.scheduledAt ?? null,
        completedAt: r.jobReport?.completedAt ?? null,
        technician: r.assignedTechnician
          ? { id: r.assignedTechnician.id, name: r.assignedTechnician.name, phone: r.assignedTechnician.phone }
          : null,
        invoice: inv
          ? {
              id: inv.id,
              invoiceRef: inv.invoiceRef,
              total: money(inv.total),
              amountPaid: money(
                inv.paymentStatus === PaymentStatus.PAID ? inv.total : inv.advanceAmount,
              ),
              due: money(
                inv.paymentStatus === PaymentStatus.PAID
                  ? 0
                  : Math.max(0, Number(inv.total ?? 0) - Number(inv.advanceAmount ?? 0)),
              ),
              paymentStatus: inv.paymentStatus,
              paymentMethod: inv.paymentMethod ?? null,
              issuedAt: inv.issuedAt,
              paidAt: inv.paidAt ?? null,
            }
          : null,
      };
    });

    const countBy = (status: RequestStatus) => jobs.filter((j) => j.status === status).length;
    const sum = (pick: (j: (typeof jobs)[number]) => number) => money(jobs.reduce((t, j) => t + pick(j), 0));

    return {
      ...customer,
      totalDue: sum((j) => j.invoice?.due ?? 0),
      stats: {
        totalJobs: jobs.length,
        completed: countBy(RequestStatus.COMPLETED),
        inProgress: countBy(RequestStatus.IN_PROGRESS) + countBy(RequestStatus.ASSIGNED),
        pending: countBy(RequestStatus.PENDING),
        cancelled: countBy(RequestStatus.CANCELLED),
        totalBilled: sum((j) => j.invoice?.total ?? 0),
        totalPaid: sum((j) => j.invoice?.amountPaid ?? 0),
        // Newest job first, so the first row is the latest visit
        lastJobAt: jobs[0]?.createdAt ?? null,
      },
      jobs,
    };
  }

  async update(id: string, dto: Partial<Customer>) {
    const c = await this.getEntity(id);
    Object.assign(c, dto);
    await this.repo.save(c);
    // Re-read, so the password hash never rides back out in the response
    return this.findOne(id);
  }

  async resetPassword(id: string, newPassword: string) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Customer not found');
    c.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.repo.save(c);
    return { message: 'Password reset successfully' };
  }
}
