import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobReport } from './entities/job-report.entity';
import { JobPart } from './entities/job-part.entity';
import { JobService as JobServiceEntity } from './entities/job-service.entity';
import { JobExpense } from './entities/job-expense.entity';
import { ServiceRequest, RequestSource, RequestStatus } from '../service-requests/entities/service-request.entity';
import { Part } from '../parts/entities/part.entity';
import { Invoice, PaymentStatus } from '../invoices/entities/invoice.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Technician } from '../technicians/entities/technician.entity';
import { findCustomerByPhone, normalizeUaePhone, requireUaePhone, UAE_PHONE_ERROR } from '../common/phone';

const VAT_RATE = 0.05;

// Phone in local form for matching: digits only, +971 / 00971 → 0…, +880 → 01…
// so "+971 50 123 4567" and "0501234567" are the same customer
@Injectable()
export class JobReportsService {
  constructor(
    @InjectRepository(JobReport) private reportsRepo: Repository<JobReport>,
    @InjectRepository(ServiceRequest) private srRepo: Repository<ServiceRequest>,
    @InjectRepository(Part) private partsRepo: Repository<Part>,
    @InjectRepository(Invoice) private invoicesRepo: Repository<Invoice>,
    @InjectRepository(Customer) private customersRepo: Repository<Customer>,
  ) {}

  async submit(serviceRequestId: string, technicianId: string, dto: any) {
    const sr = await this.srRepo.findOne({
      where: { id: serviceRequestId },
      relations: ['customer', 'assignedTechnician'],
    });
    if (!sr) throw new NotFoundException('Service request not found');

    const { report, invoice } = await this.createCompletedJob(sr, technicianId, dto);
    return { report, invoice };
  }

  async submitInstantJob(technicianId: string, dto: any) {
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
    } else {
      customer.name = dto.name || customer.name;
      customer.address = dto.address || customer.address;
      customer.lat = dto.lat ?? customer.lat;
      customer.lng = dto.lng ?? customer.lng;
    }
    customer = await this.customersRepo.save(customer);

    const sr = this.srRepo.create({
      jobRef: this.generateJobRef(),
      source: dto.source || RequestSource.PHONE,
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
      assignedTechnician: { id: technicianId } as any,
      status: RequestStatus.ASSIGNED,
      isRecurring: false,
    });

    const savedRequest = await this.srRepo.save(sr);
    return this.createCompletedJob(savedRequest, technicianId, dto);
  }

  // ── Bulk import of past jobs ────────────────────────────────────────────
  // Each job is created in its own transaction (customer, completed job, report, invoice), so one
  // bad job does not stop the rest. Billing follows the app: services only, amounts include VAT.
  async bulkImport(jobs: {
    jobNo: string; date?: string; name: string; phone: string; address?: string;
    technicianPhone?: string; paymentType: string; advance?: number;
    services: { serviceName: string; quantity: number; unitPrice: number }[];
  }[]) {
    const created: { jobNo: string; jobRef: string; total: number }[] = [];
    const errors: { jobNo: string; message: string }[] = [];

    for (const job of jobs) {
      try {
        const date = job.date ? new Date(job.date) : new Date();
        if (Number.isNaN(date.getTime())) throw new Error(`Invalid date "${job.date}"`);

        const lines = job.services.map((l) => ({
          serviceName: l.serviceName.trim(),
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          labourCost: Math.round(l.quantity * l.unitPrice * 100) / 100,
        }));
        const grandTotal = lines.reduce((s, l) => s + l.labourCost, 0);
        if (grandTotal <= 0) throw new Error('Total is 0 — every service needs a qty and unit price');
        const vatAmount = Math.round((grandTotal * VAT_RATE / (1 + VAT_RATE)) * 100) / 100;

        const isDue = job.paymentType === 'due';
        const advance = isDue ? Math.round((job.advance ?? 0) * 100) / 100 : 0;
        if (advance >= grandTotal) throw new Error(`Advance ${advance} is not less than the total ${grandTotal} — use cash or card`);

        const jobRef = await this.freeJobRef();

        await this.reportsRepo.manager.transaction(async (m) => {
          const technician = job.technicianPhone?.trim()
            ? await m.findOne(Technician, { where: { phone: job.technicianPhone.trim() } })
            : null;
          if (job.technicianPhone?.trim() && !technician) throw new Error(`No technician with phone ${job.technicianPhone}`);

          // UAE numbers only, saved as +971…. An existing customer (same number, any
          // formatting) is reused — never added twice — and keeps their saved name
          const phone = normalizeUaePhone(job.phone);
          if (!phone) throw new Error(`Phone "${job.phone}": ${UAE_PHONE_ERROR}`);
          let customer = await findCustomerByPhone(m, phone);
          if (!customer) {
            customer = await m.save(m.create(Customer, { name: job.name.trim(), phone, address: job.address?.trim() || undefined }));
          } else if (!customer.address && job.address?.trim()) {
            customer.address = job.address.trim();
            await m.save(customer);
          }

          const items = lines.map((l) => l.serviceName);
          const sr = await m.save(m.create(ServiceRequest, {
            jobRef,
            source: RequestSource.ADMIN,
            serviceType: items.join(', '),
            serviceItems: items,
            address: job.address?.trim() || customer.address,
            customer,
            assignedTechnician: technician ?? undefined,
            status: RequestStatus.COMPLETED,
            isRecurring: false,
            createdAt: date,
          }));

          const report = await m.save(m.create(JobReport, {
            serviceRequest: sr,
            technician: technician ?? undefined,
            labourCharge: grandTotal,
            partsTotal: 0,
            extraExpensesTotal: 0,
            vatAmount,
            grandTotal,
            completedAt: date,
            createdAt: date,
            parts: [],
            expenses: [],
            services: lines.map((l) => m.create(JobServiceEntity, l)),
          }));

          await m.save(m.create(Invoice, {
            invoiceRef: `INV-${jobRef.replace('JOB-', '')}`,
            jobReport: report,
            customer,
            subtotal: grandTotal - vatAmount,
            vat: vatAmount,
            total: grandTotal,
            paymentMethod: job.paymentType,
            advanceAmount: advance,
            paymentStatus: isDue ? (advance > 0 ? PaymentStatus.PARTIAL : PaymentStatus.UNPAID) : PaymentStatus.PAID,
            paidAt: isDue ? null : date,
            issuedAt: date,
          }));
        });

        created.push({ jobNo: job.jobNo, jobRef, total: grandTotal });
      } catch (e) {
        errors.push({ jobNo: job.jobNo, message: e instanceof Error ? e.message : String(e) });
      }
    }

    return { created, errors };
  }

  // Random refs can collide once there are many jobs — pick one that is not taken
  private async freeJobRef(): Promise<string> {
    for (let i = 0; i < 20; i++) {
      const ref = this.generateJobRef();
      if (!(await this.srRepo.exists({ where: { jobRef: ref } }))) return ref;
    }
    throw new Error('Could not find a free job number');
  }

  private generateJobRef(): string {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `JOB-${num}`;
  }

  private async createCompletedJob(sr: ServiceRequest, technicianId: string, dto: any) {
    if (!sr.assignedTechnician) {
      sr.assignedTechnician = { id: technicianId } as any;
    }

    // Build parts list and auto-deduct stock
    const parts: JobPart[] = [];
    let partsTotal = 0;

    for (const p of dto.parts || []) {
      const jobPart = new JobPart();
      jobPart.quantity = p.quantity;
      jobPart.unitPrice = p.unitPrice;
      jobPart.lineTotal = p.quantity * p.unitPrice;
      partsTotal += jobPart.lineTotal;

      if (p.partId) {
        const cataloguePart = await this.partsRepo.findOne({ where: { id: p.partId } });
        if (cataloguePart) {
          jobPart.part = cataloguePart;
          jobPart.isCustom = false;
          // Stock qty is managed by admin via challan (purchase) and set-remaining — not auto-deducted here
        }
      } else {
        // Custom part — flag for admin review
        jobPart.customPartName = p.customPartName;
        jobPart.isCustom = true;
        const reviewPart = this.partsRepo.create({
          name: p.customPartName,
          sku: `CUSTOM-${Date.now()}`,
          unitPrice: p.unitPrice,
          stockQty: 0,
          needsReview: true,
        });
        await this.partsRepo.save(reviewPart);
        jobPart.part = reviewPart;
      }

      parts.push(jobPart);
    }

    // Build services
    const services: JobServiceEntity[] = (dto.services || []).map((s: any) => {
      const js = new JobServiceEntity();
      js.serviceName = s.serviceName;
      // Older clients send only labourCost — treat it as a single unit at that price
      js.quantity = s.quantity ?? 1;
      js.unitPrice = s.unitPrice ?? (s.labourCost || 0);
      js.labourCost = s.quantity != null && s.unitPrice != null
        ? s.quantity * s.unitPrice
        : s.labourCost || 0;
      js.notes = s.notes;
      return js;
    });

    // Build extra expenses
    const expenses: JobExpense[] = (dto.expenses || []).map((e: any) => {
      const je = new JobExpense();
      je.description = e.description;
      je.amount = e.amount;
      return je;
    });
    const expensesTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

    // Totals — labourCharge is the sum of the service lines (falls back to the
    // client's figure for older apps); parts are recorded but not billed
    const servicesTotal = services.reduce((s, js) => s + Number(js.labourCost), 0);
    const labourCharge = servicesTotal > 0 ? servicesTotal : dto.labourCharge || 150;
    // Entered amounts already include VAT — pull the VAT portion out of the total
    // Only services are billed; extra expenses are recorded (extraExpensesTotal) but not charged
    const grandTotal = labourCharge;
    const vatAmount = Math.round((grandTotal * VAT_RATE / (1 + VAT_RATE)) * 100) / 100;
    const subtotal = grandTotal - vatAmount;

    // Save job report
    const paymentType = dto.paymentType;
    const advanceAmount = paymentType === 'due' ? Number(dto.advanceAmount) || 0 : 0;

    const report = this.reportsRepo.create({
      serviceRequest: sr,
      technician: { id: technicianId } as any,
      faultFound: dto.faultFound,
      diagnosisNotes: dto.diagnosisNotes,
      labourCharge,
      partsTotal,
      extraExpensesTotal: expensesTotal,
      vatAmount,
      grandTotal,
      customerSignatureUrl: dto.customerSignatureUrl,
      arrivedAt: dto.arrivedAt ? new Date(dto.arrivedAt) : null,
      completedAt: new Date(),
      parts,
      services,
      expenses,
    });

    await this.reportsRepo.save(report);

    // Mark service request as completed
    sr.status = RequestStatus.COMPLETED;
    await this.srRepo.save(sr);

    // Auto-generate invoice
    const invoiceRef = `INV-${sr.jobRef.replace('JOB-', '')}`;
    const invoice = this.invoicesRepo.create({
      invoiceRef,
      jobReport: report,
      customer: sr.customer,
      subtotal,
      vat: vatAmount,
      total: grandTotal,
      paymentMethod: paymentType,
      advanceAmount,
      paymentStatus:
        paymentType === 'due'
          ? advanceAmount > 0
            ? PaymentStatus.PARTIAL
            : PaymentStatus.UNPAID
          : PaymentStatus.PAID,
      paidAt: paymentType === 'due' ? null : new Date(),
    });
    await this.invoicesRepo.save(invoice);

    return { serviceRequest: sr, report, invoice };
  }

  async findOne(id: string) {
    const report = await this.reportsRepo.findOne({
      where: { id },
      relations: ['serviceRequest', 'technician', 'parts', 'parts.part', 'services', 'expenses', 'invoice'],
    });
    if (!report) throw new NotFoundException('Job report not found');
    return report;
  }

  async findByTechnician(techId: string) {
    return this.reportsRepo.find({
      where: { technician: { id: techId } },
      relations: ['serviceRequest', 'serviceRequest.customer'],
      order: { createdAt: 'DESC' },
    });
  }

  // Staff performance stats
  async getStaffPerformance() {
    return this.reportsRepo
      .createQueryBuilder('jr')
      .select('tech.id', 'techId')
      .addSelect('tech.name', 'techName')
      .addSelect('COUNT(jr.id)', 'jobsCompleted')
      .addSelect('SUM(jr.grandTotal)', 'totalRevenue')
      .addSelect('AVG(EXTRACT(EPOCH FROM (jr.completedAt - jr.arrivedAt))/3600)', 'avgDurationHours')
      .leftJoin('jr.technician', 'tech')
      .groupBy('tech.id')
      .addGroupBy('tech.name')
      .getRawMany();
  }
}
