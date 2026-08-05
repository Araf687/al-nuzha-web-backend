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
exports.JobService = void 0;
const typeorm_1 = require("typeorm");
const job_report_entity_1 = require("./job-report.entity");
let JobService = class JobService {
};
exports.JobService = JobService;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], JobService.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => job_report_entity_1.JobReport, (jr) => jr.services),
    __metadata("design:type", job_report_entity_1.JobReport)
], JobService.prototype, "jobReport", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], JobService.prototype, "serviceName", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], JobService.prototype, "labourCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], JobService.prototype, "notes", void 0);
exports.JobService = JobService = __decorate([
    (0, typeorm_1.Entity)('job_services')
], JobService);
//# sourceMappingURL=job-service.entity.js.map