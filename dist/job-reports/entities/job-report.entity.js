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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobReport = void 0;
const typeorm_1 = require("typeorm");
const service_request_entity_1 = require("../../service-requests/entities/service-request.entity");
const technician_entity_1 = require("../../technicians/entities/technician.entity");
const job_part_entity_1 = require("./job-part.entity");
const job_service_entity_1 = require("./job-service.entity");
const job_expense_entity_1 = require("./job-expense.entity");
const invoice_entity_1 = require("../../invoices/entities/invoice.entity");
let JobReport = class JobReport {
};
exports.JobReport = JobReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], JobReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => service_request_entity_1.ServiceRequest, (sr) => sr.jobReport),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", service_request_entity_1.ServiceRequest)
], JobReport.prototype, "serviceRequest", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => technician_entity_1.Technician, (t) => t.jobReports, { eager: true }),
    __metadata("design:type", technician_entity_1.Technician)
], JobReport.prototype, "technician", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], JobReport.prototype, "faultFound", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], JobReport.prototype, "diagnosisNotes", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], JobReport.prototype, "labourCharge", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], JobReport.prototype, "partsTotal", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], JobReport.prototype, "extraExpensesTotal", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], JobReport.prototype, "vatAmount", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], JobReport.prototype, "grandTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], JobReport.prototype, "customerSignatureUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamptz' }),
    __metadata("design:type", Date)
], JobReport.prototype, "arrivedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamptz' }),
    __metadata("design:type", Date)
], JobReport.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], JobReport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => job_part_entity_1.JobPart, (p) => p.jobReport, { cascade: true, eager: true }),
    __metadata("design:type", Array)
], JobReport.prototype, "parts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => job_service_entity_1.JobService, (s) => s.jobReport, { cascade: true, eager: true }),
    __metadata("design:type", Array)
], JobReport.prototype, "services", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => job_expense_entity_1.JobExpense, (e) => e.jobReport, { cascade: true, eager: true }),
    __metadata("design:type", Array)
], JobReport.prototype, "expenses", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => invoice_entity_1.Invoice, (inv) => inv.jobReport),
    __metadata("design:type", invoice_entity_1.Invoice)
], JobReport.prototype, "invoice", void 0);
exports.JobReport = JobReport = __decorate([
    (0, typeorm_1.Entity)('job_reports')
], JobReport);
//# sourceMappingURL=job-report.entity.js.map