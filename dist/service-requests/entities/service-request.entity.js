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
exports.ServiceRequest = exports.RequestStatus = exports.RequestSource = void 0;
const typeorm_1 = require("typeorm");
const customer_entity_1 = require("../../customers/entities/customer.entity");
const technician_entity_1 = require("../../technicians/entities/technician.entity");
const job_report_entity_1 = require("../../job-reports/entities/job-report.entity");
var RequestSource;
(function (RequestSource) {
    RequestSource["PHONE"] = "phone";
    RequestSource["WEBSITE"] = "website";
    RequestSource["ADMIN"] = "admin";
})(RequestSource || (exports.RequestSource = RequestSource = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["PENDING"] = "pending";
    RequestStatus["ASSIGNED"] = "assigned";
    RequestStatus["IN_PROGRESS"] = "in_progress";
    RequestStatus["COMPLETED"] = "completed";
    RequestStatus["CANCELLED"] = "cancelled";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
let ServiceRequest = class ServiceRequest {
};
exports.ServiceRequest = ServiceRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ServiceRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], ServiceRequest.prototype, "jobRef", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: RequestSource, default: RequestSource.PHONE }),
    __metadata("design:type", String)
], ServiceRequest.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceRequest.prototype, "serviceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ServiceRequest.prototype, "equipmentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ServiceRequest.prototype, "equipmentBrand", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ServiceRequest.prototype, "equipmentModel", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], ServiceRequest.prototype, "problemDescription", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ServiceRequest.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], ServiceRequest.prototype, "lat", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 7, nullable: true }),
    __metadata("design:type", Number)
], ServiceRequest.prototype, "lng", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ServiceRequest.prototype, "preferredTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDING }),
    __metadata("design:type", String)
], ServiceRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ServiceRequest.prototype, "isRecurring", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ServiceRequest.prototype, "parentJobId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer, (c) => c.serviceRequests, { eager: true }),
    __metadata("design:type", customer_entity_1.Customer)
], ServiceRequest.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => technician_entity_1.Technician, (t) => t.assignedRequests, { nullable: true, eager: true }),
    __metadata("design:type", technician_entity_1.Technician)
], ServiceRequest.prototype, "assignedTechnician", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => job_report_entity_1.JobReport, (jr) => jr.serviceRequest),
    __metadata("design:type", job_report_entity_1.JobReport)
], ServiceRequest.prototype, "jobReport", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ServiceRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamptz' }),
    __metadata("design:type", Date)
], ServiceRequest.prototype, "scheduledAt", void 0);
exports.ServiceRequest = ServiceRequest = __decorate([
    (0, typeorm_1.Entity)('service_requests')
], ServiceRequest);
//# sourceMappingURL=service-request.entity.js.map