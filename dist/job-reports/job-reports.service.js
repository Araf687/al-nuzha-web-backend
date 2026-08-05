"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const job_report_entity_1 = require("./entities/job-report.entity");
const job_part_entity_1 = require("./entities/job-part.entity");
const job_service_entity_1 = require("./entities/job-service.entity");
const job_expense_entity_1 = require("./entities/job-expense.entity");
const service_request_entity_1 = require("../service-requests/entities/service-request.entity");
const part_entity_1 = require("../parts/entities/part.entity");
const invoice_entity_1 = require("../invoices/entities/invoice.entity");
const customer_entity_1 = require("../customers/entities/customer.entity");
const VAT_RATE = 0.05;
let JobReportsService = class JobReportsService {
    constructor(reportsRepo, srRepo, partsRepo, invoicesRepo, customersRepo) {
        this.reportsRepo = reportsRepo;
        this.srRepo = srRepo;
        this.partsRepo = partsRepo;
        this.invoicesRepo = invoicesRepo;
        this.customersRepo = customersRepo;
    }
    async submit(serviceRequestId, technicianId, dto) {
        const sr = await this.srRepo.findOne({
            where: { id: serviceRequestId },
            relations: ['customer', 'assignedTechnician'],
        });
        if (!sr)
            throw new common_1.NotFoundException('Service request not found');
        const { report, invoice } = await this.createCompletedJob(sr, technicianId, dto);
        return { report, invoice };
    }
    async submitInstantJob(technicianId, dto) {
        let customer = await this.customersRepo.findOne({ where: { phone: dto.phone } });
        if (!customer) {
            customer = this.customersRepo.create({
                name: dto.name,
                phone: dto.phone,
                address: dto.address,
                lat: dto.lat,
                lng: dto.lng,
            });
        }
        else {
            customer.name = dto.name || customer.name;
            customer.address = dto.address || customer.address;
            customer.lat = dto.lat ?? customer.lat;
            customer.lng = dto.lng ?? customer.lng;
        }
        customer = await this.customersRepo.save(customer);
        const sr = this.srRepo.create({
            jobRef: this.generateJobRef(),
            source: dto.source || service_request_entity_1.RequestSource.PHONE,
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
            assignedTechnician: { id: technicianId },
            status: service_request_entity_1.RequestStatus.ASSIGNED,
            isRecurring: false,
        });
        const savedRequest = await this.srRepo.save(sr);
        return this.createCompletedJob(savedRequest, technicianId, dto);
    }
    generateJobRef() {
        const num = Math.floor(1000 + Math.random() * 9000);
        return `JOB-${num}`;
    }
    async createCompletedJob(sr, technicianId, dto) {
        if (!sr.assignedTechnician) {
            sr.assignedTechnician = { id: technicianId };
        }
        const parts = [];
        let partsTotal = 0;
        for (const p of dto.parts || []) {
            const jobPart = new job_part_entity_1.JobPart();
            jobPart.quantity = p.quantity;
            jobPart.unitPrice = p.unitPrice;
            jobPart.lineTotal = p.quantity * p.unitPrice;
            partsTotal += jobPart.lineTotal;
            if (p.partId) {
                const cataloguePart = await this.partsRepo.findOne({ where: { id: p.partId } });
                if (cataloguePart) {
                    jobPart.part = cataloguePart;
                    jobPart.isCustom = false;
                }
            }
            else {
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
        const services = (dto.services || []).map((s) => {
            const js = new job_service_entity_1.JobService();
            js.serviceName = s.serviceName;
            js.labourCost = s.labourCost || 0;
            js.notes = s.notes;
            return js;
        });
        const expenses = (dto.expenses || []).map((e) => {
            const je = new job_expense_entity_1.JobExpense();
            je.description = e.description;
            je.amount = e.amount;
            return je;
        });
        const expensesTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
        const labourCharge = dto.labourCharge || 150;
        const subtotal = labourCharge + expensesTotal;
        const vatAmount = subtotal * VAT_RATE;
        const grandTotal = subtotal + vatAmount;
        const paymentType = dto.paymentType;
        const advanceAmount = paymentType === 'due' ? Number(dto.advanceAmount) || 0 : 0;
        const report = this.reportsRepo.create({
            serviceRequest: sr,
            technician: { id: technicianId },
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
        sr.status = service_request_entity_1.RequestStatus.COMPLETED;
        await this.srRepo.save(sr);
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
            paymentStatus: paymentType === 'due'
                ? advanceAmount > 0
                    ? invoice_entity_1.PaymentStatus.PARTIAL
                    : invoice_entity_1.PaymentStatus.UNPAID
                : invoice_entity_1.PaymentStatus.PAID,
            paidAt: paymentType === 'due' ? null : new Date(),
        });
        await this.invoicesRepo.save(invoice);
        return { serviceRequest: sr, report, invoice };
    }
    async findOne(id) {
        const report = await this.reportsRepo.findOne({
            where: { id },
            relations: ['serviceRequest', 'technician', 'parts', 'parts.part', 'services', 'expenses', 'invoice'],
        });
        if (!report)
            throw new common_1.NotFoundException('Job report not found');
        return report;
    }
    async findByTechnician(techId) {
        return this.reportsRepo.find({
            where: { technician: { id: techId } },
            relations: ['serviceRequest', 'serviceRequest.customer'],
            order: { createdAt: 'DESC' },
        });
    }
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
};
exports.JobReportsService = JobReportsService;
exports.JobReportsService = JobReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(job_report_entity_1.JobReport)),
    __param(1, (0, typeorm_1.InjectRepository)(service_request_entity_1.ServiceRequest)),
    __param(2, (0, typeorm_1.InjectRepository)(part_entity_1.Part)),
    __param(3, (0, typeorm_1.InjectRepository)(invoice_entity_1.Invoice)),
    __param(4, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], JobReportsService);
//# sourceMappingURL=job-reports.service.js.map