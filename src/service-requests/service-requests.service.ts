import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { ServiceRequest, RequestStatus, RequestSource } from './entities/service-request.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Technician } from '../technicians/entities/technician.entity';
import { PushNotificationService } from '../common/push-notification.service';
import { JobReport } from '../job-reports/entities/job-report.entity';
import { JobService } from '../job-reports/entities/job-service.entity';
import { Invoice, PaymentStatus } from '../invoices/entities/invoice.entity';
import { findCustomerByPhone, requireUaePhone } from '../common/phone';

// Same rule as the job report: only services are billed, and the amount entered includes VAT
const VAT_RATE = 0.05;

// Page size for the admin job list; a client asking for more is capped
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

// Extra value accepted by the `status` filter: not a real request status, but
// "this job's invoice still has money owed on it"
const DUE_STATUS = 'due';
const DUE_CONDITION = `(
  invoice.id IS NOT NULL
  AND invoice."paymentStatus" <> 'paid'
  AND (invoice.total - invoice."advanceAmount") > 0
)`;

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest)
    private repo: Repository<ServiceRequest>,
    @InjectRepository(Customer)
    private customersRepo: Repository<Customer>,
    @InjectRepository(Technician)
    private techRepo: Repository<Technician>,
    private pushService: PushNotificationService,
  ) {}

  private generateJobRef(): string {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `JOB-${num}`;
  }

  private async notifyTechnician(technicianId: string, jobRef: string, jobId: string) {
    const tech = await this.techRepo.findOne({ where: { id: technicianId } });
    if (tech?.expoPushToken) {
      await this.pushService.send(
        tech.expoPushToken,
        'New Job Assigned',
        `Job ${jobRef} has been assigned to you.`,
        { jobId },
      );
    }
  }

  // ── Create new request (from website or phone) ──────────────────────────
  async create(dto: any) {
    const serviceItems: string[] | undefined = dto.serviceItems
      ?.map((s: string) => s.trim())
      .filter(Boolean);
    const serviceType = dto.serviceType?.trim() || serviceItems?.join(', ');
    if (!serviceType) {
      throw new BadRequestException('serviceType or serviceItems is required');
    }

    // House no is required for jobs made by staff (admin panel / technician app).
    // The public website booking form does not ask for it yet.
    const houseNo: string | undefined = typeof dto.houseNo === 'string' ? dto.houseNo.trim() || undefined : undefined;
    if (!houseNo && (dto.source ?? RequestSource.WEBSITE) !== RequestSource.WEBSITE) {
      throw new BadRequestException('House no is required');
    }

    // Upsert customer by phone (UAE only, stored as +971…)
    const phone = requireUaePhone(dto.phone);
    let customer = await findCustomerByPhone(this.customersRepo.manager, phone);
    if (!customer) {
      customer = this.customersRepo.create({
        name: dto.name,
        phone,
        address: dto.address,
        lat: dto.lat,
        lng: dto.lng,
      });
      await this.customersRepo.save(customer);
    }

    const req = this.repo.create({
      jobRef: this.generateJobRef(),
      source: dto.source || RequestSource.WEBSITE,
      serviceType,
      serviceItems: serviceItems?.length ? serviceItems : undefined,
      equipmentType: dto.equipmentType,
      equipmentBrand: dto.equipmentBrand,
      equipmentModel: dto.equipmentModel,
      problemDescription: dto.problemDescription,
      address: dto.address || customer.address,
      houseNo,
      lat: dto.lat,
      lng: dto.lng,
      preferredTime: dto.preferredTime,
      customer,
      isRecurring: false,
    });

    if (dto.technicianId) {
      req.assignedTechnician = { id: dto.technicianId } as any;
      req.status = RequestStatus.ASSIGNED;
    }

    const saved = await this.repo.save(req);

    if (dto.technicianId) {
      await this.notifyTechnician(dto.technicianId, saved.jobRef, saved.id);
    }

    return saved;
  }

  // ── Create recurring request from existing job ──────────────────────────
  async createRecurring(parentJobId: string, recurringDescription: string, customerId: string) {
    const parent = await this.repo.findOne({
      where: { id: parentJobId },
      relations: ['customer'],
    });
    if (!parent) throw new NotFoundException('Parent job not found');
    if (parent.customer.id !== customerId) throw new NotFoundException('Job not found for this customer');

    const req = this.repo.create({
      jobRef: this.generateJobRef(),
      source: RequestSource.WEBSITE,
      serviceType: parent.serviceType,
      equipmentType: parent.equipmentType,
      equipmentBrand: parent.equipmentBrand,
      equipmentModel: parent.equipmentModel,
      problemDescription: recurringDescription,
      address: parent.address,
      houseNo: parent.houseNo,
      lat: parent.lat,
      lng: parent.lng,
      customer: parent.customer,
      isRecurring: true,
      parentJobId: parent.id,
    });

    return this.repo.save(req);
  }

  // ── Find all (admin), one page at a time ────────────────────────────────
  async findAll(filters: {
    // One or more statuses, comma separated, plus the extra value `due`
    status?: string;
    technicianId?: string;
    isRecurring?: boolean;
    // Matches job id/ref, customer name, phone, area or service type
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Math.trunc(Number(filters.page) || 1));
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(Number(filters.limit) || DEFAULT_PAGE_SIZE)));

    const qb = this.repo.createQueryBuilder('sr')
      // Joined by hand with named columns — whole-entity joins drag the
      // customer's and technician's passwordHash into the response
      .leftJoin('sr.customer', 'customer')
      .addSelect(['customer.id', 'customer.name', 'customer.phone', 'customer.email', 'customer.address'])
      .leftJoin('sr.assignedTechnician', 'tech')
      .addSelect(['tech.id', 'tech.name', 'tech.phone', 'tech.role'])
      .leftJoinAndSelect('sr.jobReport', 'jobReport')
      .leftJoinAndSelect('jobReport.invoice', 'invoice')
      .orderBy('sr.createdAt', 'DESC');

    const requested = (filters.status ?? '')
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);

    const allowed = [...Object.values(RequestStatus), DUE_STATUS] as string[];
    const unknown = requested.filter((v) => !allowed.includes(v));
    if (unknown.length) {
      throw new BadRequestException(
        `Unknown status: ${unknown.join(', ')}. Allowed: ${allowed.join(', ')}`,
      );
    }

    const statuses = requested.filter((v) => v !== DUE_STATUS);
    const wantsDue = requested.includes(DUE_STATUS);

    // `?status=pending,due` means pending jobs OR jobs with money owed
    if (statuses.length && wantsDue) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('sr.status IN (:...statuses)', { statuses }).orWhere(DUE_CONDITION);
        }),
      );
    } else if (wantsDue) {
      qb.andWhere(DUE_CONDITION);
    } else if (statuses.length) {
      qb.andWhere('sr.status IN (:...statuses)', { statuses });
    }

    if (filters.technicianId) qb.andWhere('tech.id = :techId', { techId: filters.technicianId });
    if (filters.isRecurring !== undefined) qb.andWhere('sr.isRecurring = :r', { r: filters.isRecurring });

    const search = filters.search?.trim();
    if (search) {
      // Job id (ref or the uuid the list shows when there is no ref), customer
      // name, phone, and area. The customer's address only counts when the job
      // itself has none — otherwise a job in one area matches another area
      qb.andWhere(
        `(
          sr.jobRef ILIKE :q
          OR CAST(sr.id AS text) ILIKE :q
          OR customer.name ILIKE :q
          OR customer.phone ILIKE :q
          OR sr.address ILIKE :q
          OR (COALESCE(TRIM(sr.address), '') = '' AND customer.address ILIKE :q)
          OR sr.serviceType ILIKE :q
        )`,
        { q: `%${search}%` },
      );
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  // ── Find by customer (for dashboard) ────────────────────────────────────
  async findByCustomer(customerId: string) {
    return this.repo.find({
      where: { customer: { id: customerId } },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Find one ────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const req = await this.repo.findOne({
      where: { id },
      relations: [
        'customer',
        'assignedTechnician',
        'jobReport',
        'jobReport.technician',
        'jobReport.parts',
        'jobReport.parts.part',
        'jobReport.services',
        'jobReport.expenses',
        'jobReport.invoice',
      ],
    });
    if (!req) throw new NotFoundException('Service request not found');

    // Whole-entity relations carry passwordHash; drop it before the response.
    // The invoice's customer comes along too, because that relation is eager.
    delete (req.customer as Partial<Customer> | undefined)?.passwordHash;
    delete (req.assignedTechnician as Partial<Technician> | undefined)?.passwordHash;
    delete (req.jobReport?.technician as Partial<Technician> | undefined)?.passwordHash;
    delete (req.jobReport?.invoice?.customer as Partial<Customer> | undefined)?.passwordHash;

    return req;
  }

  // Light lookup for mutations — avoids dragging the jobReport graph through save()
  private async findOneForUpdate(id: string) {
    const req = await this.repo.findOne({
      where: { id },
      relations: ['customer', 'assignedTechnician'],
    });
    if (!req) throw new NotFoundException('Service request not found');
    return req;
  }

  // ── Assign technician ───────────────────────────────────────────────────
  async assign(id: string, technicianId: string) {
    const req = await this.findOneForUpdate(id);
    req.assignedTechnician = { id: technicianId } as any;
    req.status = RequestStatus.ASSIGNED;
    await this.repo.save(req);
    await this.notifyTechnician(technicianId, req.jobRef, req.id);
    return this.findOne(id);
  }

  // ── Update status ───────────────────────────────────────────────────────
  async updateStatus(id: string, status: RequestStatus) {
    const req = await this.findOneForUpdate(id);
    req.status = status;
    await this.repo.save(req);
    return this.findOne(id);
  }

  // ── Edit job details ────────────────────────────────────────────────────
  async update(
    id: string,
    dto: {
      name?: string;
      phone?: string;
      serviceLines?: { serviceName: string; quantity: number; unitPrice: number }[];
      serviceType?: string;
      serviceItems?: string[];
      equipmentType?: string;
      equipmentBrand?: string;
      equipmentModel?: string;
      problemDescription?: string;
      address?: string;
      houseNo?: string;
      lat?: number;
      lng?: number;
      preferredTime?: string;
      status?: RequestStatus;
      // '' clears the assignment, a uuid moves the job to that technician
      technicianId?: string;
    },
  ) {
    const req = await this.findOneForUpdate(id);

    const serviceItems = dto.serviceItems?.map((v) => v.trim()).filter(Boolean);
    const serviceType = dto.serviceType?.trim() || serviceItems?.join(', ');
    if (dto.serviceType !== undefined || dto.serviceItems !== undefined) {
      if (!serviceType) throw new BadRequestException('serviceType or serviceItems is required');
      req.serviceType = serviceType;
      if (serviceItems !== undefined) req.serviceItems = serviceItems.length ? serviceItems : null as never;
    }

    // Only the keys the caller sent are touched
    // House no can be changed but never cleared
    if (dto.houseNo !== undefined) {
      const houseNo = dto.houseNo.trim();
      if (!houseNo) throw new BadRequestException('House no is required');
      req.houseNo = houseNo;
    }

    const plain = ['equipmentType', 'equipmentBrand', 'equipmentModel', 'problemDescription',
      'address', 'lat', 'lng', 'preferredTime'] as const;
    for (const key of plain) {
      const value = dto[key];
      if (value !== undefined) Object.assign(req, { [key]: value });
    }

    if (dto.status !== undefined) req.status = dto.status;

    const previousTechnicianId = req.assignedTechnician?.id;
    let notifyTechnicianId: string | undefined;

    if (dto.technicianId !== undefined) {
      if (dto.technicianId === '') {
        req.assignedTechnician = null as never;
        // An unassigned job goes back to the pending pile unless it moved on
        if (dto.status === undefined && req.status === RequestStatus.ASSIGNED) {
          req.status = RequestStatus.PENDING;
        }
      } else {
        req.assignedTechnician = { id: dto.technicianId } as never;
        if (dto.status === undefined && req.status === RequestStatus.PENDING) {
          req.status = RequestStatus.ASSIGNED;
        }
        // Only a technician who was not already on the job gets a push
        if (dto.technicianId !== previousTechnicianId) notifyTechnicianId = dto.technicianId;
      }
    }

    // Service lines (with qty / price) live on the job report; re-total the report and its invoice
    if (dto.serviceLines !== undefined) {
      const report = await this.repo.manager.findOne(JobReport, {
        where: { serviceRequest: { id } },
        relations: ['services', 'invoice'],
      });
      if (!report) throw new BadRequestException('This job has no report yet, so it has no prices to edit');

      const lines = dto.serviceLines.map((l) => ({
        serviceName: l.serviceName.trim(),
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        labourCost: Math.round(l.quantity * l.unitPrice * 100) / 100,
      }));
      const grandTotal = lines.reduce((s, l) => s + l.labourCost, 0);
      const vat = Math.round((grandTotal * VAT_RATE / (1 + VAT_RATE)) * 100) / 100;

      await this.repo.manager.transaction(async (m) => {
        if (report.services?.length) await m.delete(JobService, report.services.map((sv) => sv.id));
        await m.save(JobService, lines.map((l) => m.create(JobService, { ...l, jobReport: { id: report.id } as JobReport })));
        await m.update(JobReport, report.id, { labourCharge: grandTotal, grandTotal, vatAmount: vat });
        const inv = report.invoice;
        if (inv) {
          const advance = Number(inv.advanceAmount) || 0;
          // A paid invoice stays paid; otherwise the status follows the new total
          const paymentStatus = inv.paymentStatus === PaymentStatus.PAID
            ? PaymentStatus.PAID
            : advance >= grandTotal ? PaymentStatus.PAID : advance > 0 ? PaymentStatus.PARTIAL : PaymentStatus.UNPAID;
          await m.update(Invoice, inv.id, { subtotal: grandTotal - vat, vat, total: grandTotal, paymentStatus });
        }
      });

      // The job's own service list follows the edited lines
      req.serviceItems = lines.map((l) => l.serviceName);
      req.serviceType = req.serviceItems.join(', ');
    }

    // Name and phone live on the customer record (phone is its unique key)
    if (dto.name !== undefined || dto.phone !== undefined) {
      const customer = req.customer;
      if (dto.name !== undefined) {
        const name = dto.name.trim();
        if (!name) throw new BadRequestException('Customer name is required');
        customer.name = name;
      }
      if (dto.phone !== undefined) {
        const phone = requireUaePhone(dto.phone);
        if (phone !== customer.phone) {
          const taken = await findCustomerByPhone(this.customersRepo.manager, phone);
          if (taken && taken.id !== customer.id) {
            throw new BadRequestException(`Phone ${phone} already belongs to another customer (${taken.name})`);
          }
          customer.phone = phone;
        }
      }
      await this.customersRepo.save(customer);
    }

    await this.repo.save(req);
    if (notifyTechnicianId) await this.notifyTechnician(notifyTechnicianId, req.jobRef, req.id);

    return this.findOne(id);
  }

  // ── Delete job ──────────────────────────────────────────────────────────
  async remove(id: string) {
    const req = await this.repo.findOne({ where: { id }, relations: ['jobReport'] });
    if (!req) throw new NotFoundException('Service request not found');

    // A report (and the invoice hanging off it) is accounting history — the FK
    // would fail anyway, so say why instead of letting Postgres complain
    if (req.jobReport) {
      throw new BadRequestException(
        'This job already has a job report, so it cannot be deleted. Cancel it instead.',
      );
    }

    await this.repo.remove(req);
    return { message: 'Job deleted successfully' };
  }

  // ── Monthly stats (for dashboard) ───────────────────────────────────────
  async getMonthlyStats() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    const total = await this.repo.count({ where: { status: RequestStatus.COMPLETED } });
    const thisMonth = await this.repo
      .createQueryBuilder('sr')
      .where('sr.createdAt >= :start', { start })
      .andWhere('sr.status = :s', { s: RequestStatus.COMPLETED })
      .getCount();

    const recurring = await this.repo.count({ where: { isRecurring: true } });
    const pending = await this.repo.count({ where: { status: RequestStatus.PENDING } });

    return { total, thisMonth, recurring, pending };
  }
}
