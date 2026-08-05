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
exports.ServiceRequestsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const service_requests_service_1 = require("./service-requests.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const service_request_entity_1 = require("./entities/service-request.entity");
class CreateServiceRequestDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "serviceType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "problemDescription", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "equipmentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "equipmentBrand", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "equipmentModel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateServiceRequestDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateServiceRequestDto.prototype, "lng", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "preferredTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "technicianId", void 0);
class RecurringRequestDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(20),
    __metadata("design:type", String)
], RecurringRequestDto.prototype, "recurringDescription", void 0);
class AssignDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignDto.prototype, "technicianId", void 0);
class UpdateStatusDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(service_request_entity_1.RequestStatus),
    __metadata("design:type", String)
], UpdateStatusDto.prototype, "status", void 0);
let ServiceRequestsController = class ServiceRequestsController {
    constructor(svc) {
        this.svc = svc;
    }
    create(dto) {
        return this.svc.create(dto);
    }
    createRecurring(id, dto, req) {
        return this.svc.createRecurring(id, dto.recurringDescription, req.user.id);
    }
    findAll(status, technicianId, isRecurring) {
        return this.svc.findAll({
            status,
            technicianId,
            isRecurring: isRecurring !== undefined ? isRecurring === 'true' : undefined,
        });
    }
    myOrders(req) {
        return this.svc.findByCustomer(req.user.id);
    }
    stats() {
        return this.svc.getMonthlyStats();
    }
    findOne(id) {
        return this.svc.findOne(id);
    }
    assign(id, dto) {
        return this.svc.assign(id, dto.technicianId);
    }
    updateStatus(id, dto) {
        return this.svc.updateStatus(id, dto.status);
    }
};
exports.ServiceRequestsController = ServiceRequestsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a new service request (guest or registered)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateServiceRequestDto]),
    __metadata("design:returntype", void 0)
], ServiceRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/recurring'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Report a recurring issue from a previous job' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RecurringRequestDto, Object]),
    __metadata("design:returntype", void 0)
], ServiceRequestsController.prototype, "createRecurring", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all service requests (admin)' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'technicianId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'isRecurring', required: false }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('technicianId')),
    __param(2, (0, common_1.Query)('isRecurring')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ServiceRequestsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my-orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get logged-in customer\'s service history' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ServiceRequestsController.prototype, "myOrders", null);
__decorate([
    (0, common_1.Get)('stats/monthly'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Monthly stats for admin dashboard' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ServiceRequestsController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServiceRequestsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/assign'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Assign a technician to a job (dispatcher)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AssignDto]),
    __metadata("design:returntype", void 0)
], ServiceRequestsController.prototype, "assign", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update job status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateStatusDto]),
    __metadata("design:returntype", void 0)
], ServiceRequestsController.prototype, "updateStatus", null);
exports.ServiceRequestsController = ServiceRequestsController = __decorate([
    (0, swagger_1.ApiTags)('service-requests'),
    (0, common_1.Controller)('service-requests'),
    __metadata("design:paramtypes", [service_requests_service_1.ServiceRequestsService])
], ServiceRequestsController);
//# sourceMappingURL=service-requests.controller.js.map