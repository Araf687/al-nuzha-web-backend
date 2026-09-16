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
exports.JobReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const job_reports_service_1 = require("./job-reports.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const service_request_entity_1 = require("../service-requests/entities/service-request.entity");
class JobPartDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JobPartDto.prototype, "partId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JobPartDto.prototype, "customPartName", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], JobPartDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], JobPartDto.prototype, "unitPrice", void 0);
class JobServiceDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JobServiceDto.prototype, "serviceName", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], JobServiceDto.prototype, "labourCost", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JobServiceDto.prototype, "notes", void 0);
class JobExpenseDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JobExpenseDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], JobExpenseDto.prototype, "amount", void 0);
class SubmitJobReportDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitJobReportDto.prototype, "faultFound", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitJobReportDto.prototype, "diagnosisNotes", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubmitJobReportDto.prototype, "labourCharge", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['card', 'cash', 'due']),
    __metadata("design:type", String)
], SubmitJobReportDto.prototype, "paymentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubmitJobReportDto.prototype, "advanceAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitJobReportDto.prototype, "customerSignatureUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitJobReportDto.prototype, "arrivedAt", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], SubmitJobReportDto.prototype, "parts", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], SubmitJobReportDto.prototype, "services", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], SubmitJobReportDto.prototype, "expenses", void 0);
class SubmitInstantJobDto extends SubmitJobReportDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitInstantJobDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitInstantJobDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitInstantJobDto.prototype, "serviceType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitInstantJobDto.prototype, "problemDescription", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitInstantJobDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitInstantJobDto.prototype, "equipmentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitInstantJobDto.prototype, "equipmentBrand", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitInstantJobDto.prototype, "equipmentModel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubmitInstantJobDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubmitInstantJobDto.prototype, "lng", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitInstantJobDto.prototype, "preferredTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(service_request_entity_1.RequestSource),
    __metadata("design:type", String)
], SubmitInstantJobDto.prototype, "source", void 0);
let JobReportsController = class JobReportsController {
    constructor(svc) {
        this.svc = svc;
    }
    submit(srId, dto, req) {
        return this.svc.submit(srId, req.user.id, dto);
    }
    submitInstant(dto, req) {
        return this.svc.submitInstantJob(req.user.id, dto);
    }
    myJobs(req) {
        return this.svc.findByTechnician(req.user.id);
    }
    staffPerformance() {
        return this.svc.getStaffPerformance();
    }
    findOne(id) {
        return this.svc.findOne(id);
    }
};
exports.JobReportsController = JobReportsController;
__decorate([
    (0, common_1.Post)('service-request/:srId'),
    (0, swagger_1.ApiOperation)({ summary: 'Technician submits a completed job report from the field' }),
    __param(0, (0, common_1.Param)('srId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SubmitJobReportDto, Object]),
    __metadata("design:returntype", void 0)
], JobReportsController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)('instant'),
    (0, swagger_1.ApiOperation)({ summary: 'Technician creates an instant job and submits the completed report in one step' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SubmitInstantJobDto, Object]),
    __metadata("design:returntype", void 0)
], JobReportsController.prototype, "submitInstant", null);
__decorate([
    (0, common_1.Get)('my-jobs'),
    (0, swagger_1.ApiOperation)({ summary: 'Technician — get their own completed job reports' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], JobReportsController.prototype, "myJobs", null);
__decorate([
    (0, common_1.Get)('staff-performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin — staff performance stats' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobReportsController.prototype, "staffPerformance", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single job report by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobReportsController.prototype, "findOne", null);
exports.JobReportsController = JobReportsController = __decorate([
    (0, swagger_1.ApiTags)('job-reports'),
    (0, common_1.Controller)('job-reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [job_reports_service_1.JobReportsService])
], JobReportsController);
//# sourceMappingURL=job-reports.controller.js.map