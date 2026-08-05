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

const VAT_RATE = 0.05;

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
    let customer = await this.customersRepo.findOne({ where: { phone: dto.phone } });
    if (!customer) {
      customer = this.customersRepo.create({
        name: dto.name,
        phone: dto.phone,
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
      js.labourCost = s.labourCost || 0;
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

    // Totals — labourCharge holds the technician's total service cost;
    // parts are recorded on the report but not billed to the customer
    const labourCharge = dto.labourCharge || 150;
    const subtotal = labourCharge + expensesTotal;
    const vatAmount = subtotal * VAT_RATE;
    const grandTotal = subtotal + vatAmount;

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
