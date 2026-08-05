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
exports.Technician = void 0;
const typeorm_1 = require("typeorm");
const service_request_entity_1 = require("../../service-requests/entities/service-request.entity");
const job_report_entity_1 = require("../../job-reports/entities/job-report.entity");
let Technician = class Technician {
};
exports.Technician = Technician;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Technician.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Technician.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Technician.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Technician.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Technician.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'technician' }),
    __metadata("design:type", String)
], Technician.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Technician.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Technician.prototype, "expoPushToken", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Technician.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => service_request_entity_1.ServiceRequest, (sr) => sr.assignedTechnician),
    __metadata("design:type", Array)
], Technician.prototype, "assignedRequests", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => job_report_entity_1.JobReport, (jr) => jr.technician),
    __metadata("design:type", Array)
], Technician.prototype, "jobReports", void 0);
exports.Technician = Technician = __decorate([
    (0, typeorm_1.Entity)('technicians')
], Technician);
//# sourceMappingURL=technician.entity.js.map