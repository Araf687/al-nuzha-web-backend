import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequest, RequestStatus, RequestSource } from './entities/service-request.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Technician } from '../technicians/entities/technician.entity';
import { PushNotificationService } from '../common/push-notification.service';

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
      serviceType: dto.serviceType,
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

  // ── Find all (admin) ────────────────────────────────────────────────────
  async findAll(filters: { status?: string; technicianId?: string; isRecurring?: boolean }) {
    const qb = this.repo.createQueryBuilder('sr')
      .leftJoinAndSelect('sr.customer', 'customer')
      .leftJoinAndSelect('sr.assignedTechnician', 'tech')
      .leftJoinAndSelect('sr.jobReport', 'jobReport')
      .leftJoinAndSelect('jobReport.invoice', 'invoice')
      .orderBy('sr.createdAt', 'DESC');

    if (filters.status) qb.andWhere('sr.status = :status', { status: filters.status });
    if (filters.technicianId) qb.andWhere('tech.id = :techId', { techId: filters.technicianId });
    if (filters.isRecurring !== undefined) qb.andWhere('sr.isRecurring = :r', { r: filters.isRecurring });

    return qb.getMany();
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
