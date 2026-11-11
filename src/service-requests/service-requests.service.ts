import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { ServiceRequest, RequestStatus, RequestSource } from './entities/service-request.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Technician } from '../technicians/entities/technician.entity';
import { PushNotificationService } from '../common/push-notification.service';

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

    // Upsert customer by phone
    let customer = await this.customersRepo.findOne({ where: { phone: dto.phone } });
    if (!customer) {
      customer = this.customersRepo.create({
        name: dto.name,
        phone: dto.phone,
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
      serviceType?: string;
      serviceItems?: string[];
      equipmentType?: string;
      equipmentBrand?: string;
      equipmentModel?: string;
      problemDescription?: string;
      address?: string;
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
