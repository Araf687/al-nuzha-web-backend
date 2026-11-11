import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, PaymentStatus } from './entities/invoice.entity';

// Page size for the admin invoice list; a client asking for more is capped
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export interface InvoiceQuery {
  status?: PaymentStatus;
  // Matches invoice ref, customer name or phone
  search?: string;
  page?: number;
  limit?: number;
}

function money(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

@Injectable()
export class InvoicesService {
  constructor(@InjectRepository(Invoice) private repo: Repository<Invoice>) {}

  /**
   * One page of invoices. `summary` covers everything the filters match, not
   * just this page, so the totals beside the list stay right while paging.
   */
  async findAll(filters: InvoiceQuery = {}) {
    const page = Math.max(1, Math.trunc(Number(filters.page) || 1));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(Number(filters.limit) || DEFAULT_PAGE_SIZE)));

    const [data, totals] = await Promise.all([
      this.invoiceQuery(filters)
        .orderBy('inv.issuedAt', 'DESC')
        .offset((page - 1) * limit)
        .limit(limit)
        .getMany(),

      this.invoiceQuery(filters)
        .select('COUNT(*)', 'invoices')
        .addSelect('COALESCE(SUM(inv.total), 0)', 'totalBilled')
        .addSelect(
          `COALESCE(SUM(CASE WHEN inv."paymentStatus" = '${PaymentStatus.PAID}'
                             THEN inv.total ELSE inv."advanceAmount" END), 0)`,
          'collected',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN inv."paymentStatus" = '${PaymentStatus.PAID}'
                             THEN 0 ELSE GREATEST(inv.total - inv."advanceAmount", 0) END), 0)`,
          'outstanding',
        )
        .addSelect(`COUNT(*) FILTER (WHERE inv."paymentStatus" = '${PaymentStatus.PAID}')`, 'paidCount')
        .getRawOne<{
          invoices: string; totalBilled: string; collected: string;
          outstanding: string; paidCount: string;
        }>(),
    ]);

    const total = Number(totals?.invoices ?? 0);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary: {
        invoices: total,
        totalBilled: money(totals?.totalBilled),
        collected: money(totals?.collected),
        outstanding: money(totals?.outstanding),
        paidCount: Number(totals?.paidCount ?? 0),
      },
    };
  }

  /** Filtered but unpaged — shared by the list and its totals. */
  private invoiceQuery({ status, search }: InvoiceQuery) {
    const qb = this.repo
      .createQueryBuilder('inv')
      // The customer relation is eager, and a whole-entity load would carry
      // their passwordHash into the response
      .leftJoin('inv.customer', 'customer')
      .addSelect(['customer.id', 'customer.name', 'customer.phone', 'customer.email']);

    if (status) qb.andWhere('inv.paymentStatus = :status', { status });

    const q = search?.trim();
    if (q) {
      qb.andWhere(
        '(inv.invoiceRef ILIKE :q OR customer.name ILIKE :q OR customer.phone ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    return qb;
  }

  findByCustomer(customerId: string) {
    return this.repo.find({
      where: { customer: { id: customerId } },
      order: { issuedAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const inv = await this.repo.findOne({
      where: { id },
      relations: ['customer', 'jobReport', 'jobReport.parts', 'jobReport.services', 'jobReport.expenses'],
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async markPaid(id: string, method: string) {
    const inv = await this.findOne(id);
    inv.paymentStatus = PaymentStatus.PAID;
    inv.paymentMethod = method;
    inv.paidAt = new Date();
    return this.repo.save(inv);
  }

  async updatePayment(
    id: string,
    dto: { paymentStatus: PaymentStatus; amountPaid?: number; paymentMethod?: string },
  ) {
    const inv = await this.findOne(id);
    const totalCents = Math.round(Number(inv.total) * 100);

    switch (dto.paymentStatus) {
      case PaymentStatus.PAID:
        // Keep the original paid date if it was already paid
        if (inv.paymentStatus !== PaymentStatus.PAID || !inv.paidAt) inv.paidAt = new Date();
        break;

      case PaymentStatus.PARTIAL: {
        const paidCents = Math.round(Number(dto.amountPaid) * 100);
        if (!Number.isFinite(paidCents) || paidCents <= 0) {
          throw new BadRequestException('amountPaid is required for a partial payment');
        }
        if (paidCents >= totalCents) {
          throw new BadRequestException('amountPaid covers the full total — mark the invoice as paid instead');
        }
        inv.advanceAmount = paidCents / 100;
        inv.paidAt = null;
        break;
      }

      case PaymentStatus.UNPAID:
        inv.advanceAmount = 0;
        inv.paidAt = null;
        break;
    }

    inv.paymentStatus = dto.paymentStatus;
    if (dto.paymentMethod) inv.paymentMethod = dto.paymentMethod;
    return this.repo.save(inv);
  }

  async getRevenueSummary() {
    return this.repo
      .createQueryBuilder('inv')
      .select("DATE_TRUNC('month', inv.issuedAt)", 'month')
      .addSelect('SUM(inv.total)', 'totalRevenue')
      .addSelect('SUM(CASE WHEN inv.paymentStatus = :paid THEN inv.total ELSE 0 END)', 'collectedRevenue')
      .addSelect('COUNT(inv.id)', 'invoiceCount')
      .setParameter('paid', PaymentStatus.PAID)
      .groupBy("DATE_TRUNC('month', inv.issuedAt)")
      .orderBy("DATE_TRUNC('month', inv.issuedAt)", 'DESC')
      .limit(6)
      .getRawMany();
  }
}
