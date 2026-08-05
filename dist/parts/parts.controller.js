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
exports.PartsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const parts_service_1 = require("./parts.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
class CreatePartDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePartDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePartDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePartDto.prototype, "unitPrice", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePartDto.prototype, "stockQty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePartDto.prototype, "minStockLevel", void 0);
class SetRemainingQtyDto {
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SetRemainingQtyDto.prototype, "qty", void 0);
class BulkPartRowDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkPartRowDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkPartRowDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], BulkPartRowDto.prototype, "unitPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], BulkPartRowDto.prototype, "minStockLevel", void 0);
class BulkCreatePartsDto {
}
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BulkPartRowDto),
    __metadata("design:type", Array)
], BulkCreatePartsDto.prototype, "parts", void 0);
class ChallanItemDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChallanItemDto.prototype, "partId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ChallanItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ChallanItemDto.prototype, "unitPrice", void 0);
class CreateChallanDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChallanDto.prototype, "challanNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChallanDto.prototype, "purchaseDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChallanDto.prototype, "supplierName", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ChallanItemDto),
    __metadata("design:type", Array)
], CreateChallanDto.prototype, "items", void 0);
class BulkChallanItemDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkChallanItemDto.prototype, "partSku", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], BulkChallanItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], BulkChallanItemDto.prototype, "unitPrice", void 0);
class BulkChallanRowDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkChallanRowDto.prototype, "challanNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkChallanRowDto.prototype, "purchaseDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkChallanRowDto.prototype, "supplierName", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BulkChallanItemDto),
    __metadata("design:type", Array)
], BulkChallanRowDto.prototype, "items", void 0);
class BulkCreateChallansDto {
}
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BulkChallanRowDto),
    __metadata("design:type", Array)
], BulkCreateChallansDto.prototype, "challans", void 0);
let PartsController = class PartsController {
    constructor(svc) {
        this.svc = svc;
    }
    findAll() { return this.svc.findAll(); }
    lowStock() { return this.svc.getLowStock(); }
    pendingReview() { return this.svc.getPendingReview(); }
    listChallans() { return this.svc.findAllChallans(); }
    getOneChallan(id) { return this.svc.findOneChallan(id); }
    bulkCreate(dto) { return this.svc.bulkCreate(dto.parts); }
    bulkCreateChallans(dto) { return this.svc.bulkCreateChallans(dto.challans); }
    createChallan(dto) { return this.svc.createChallan(dto); }
    findOne(id) { return this.svc.findOne(id); }
    create(dto) { return this.svc.create(dto); }
    update(id, dto) {
        return this.svc.update(id, dto);
    }
    approve(id, dto) {
        return this.svc.approveCustomPart(id, dto);
    }
    setRemaining(id, dto) {
        return this.svc.setRemainingQty(id, dto.qty);
    }
};
exports.PartsController = PartsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all parts in catalogue' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PartsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('low-stock'),
    (0, swagger_1.ApiOperation)({ summary: 'Get parts below minimum stock level' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PartsController.prototype, "lowStock", null);
__decorate([
    (0, common_1.Get)('pending-review'),
    (0, swagger_1.ApiOperation)({ summary: 'Get custom parts added by technicians awaiting admin review' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PartsController.prototype, "pendingReview", null);
__decorate([
    (0, common_1.Get)('challans'),
    (0, swagger_1.ApiOperation)({ summary: 'List all purchase challans' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PartsController.prototype, "listChallans", null);
__decorate([
    (0, common_1.Get)('challans/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get single challan by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PartsController.prototype, "getOneChallan", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk create parts from CSV/array — returns created list and per-row errors' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BulkCreatePartsDto]),
    __metadata("design:returntype", void 0)
], PartsController.prototype, "bulkCreate", null);
__decorate([
    (0, common_1.Post)('challans/bulk'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk create challans from CSV — looks up parts by SKU, partial success per challan' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BulkCreateChallansDto]),
    __metadata("design:returntype", void 0)
], PartsController.prototype, "bulkCreateChallans", null);
__decorate([
    (0, common_1.Post)('challans'),
    (0, swagger_1.ApiOperation)({ summary: 'Create purchase challan — adds bought qty to part stock' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateChallanDto]),
    __metadata("design:returntype", void 0)
], PartsController.prototype, "createChallan", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PartsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add new part to catalogue' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePartDto]),
    __metadata("design:returntype", void 0)
], PartsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PartsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a custom part added by a technician' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PartsController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/set-remaining'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin sets actual remaining stock qty at end of month' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SetRemainingQtyDto]),
    __metadata("design:returntype", void 0)
], PartsController.prototype, "setRemaining", null);
exports.PartsController = PartsController = __decorate([
    (0, swagger_1.ApiTags)('parts'),
    (0, common_1.Controller)('parts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [parts_service_1.PartsService])
], PartsController);
//# sourceMappingURL=parts.controller.js.map