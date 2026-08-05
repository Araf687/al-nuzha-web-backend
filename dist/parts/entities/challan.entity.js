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
exports.PartChallan = void 0;
const typeorm_1 = require("typeorm");
const challan_item_entity_1 = require("./challan-item.entity");
let PartChallan = class PartChallan {
};
exports.PartChallan = PartChallan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PartChallan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], PartChallan.prototype, "challanNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], PartChallan.prototype, "purchaseDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PartChallan.prototype, "supplierName", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => challan_item_entity_1.ChallanItem, item => item.challan, { cascade: true, eager: true }),
    __metadata("design:type", Array)
], PartChallan.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PartChallan.prototype, "createdAt", void 0);
exports.PartChallan = PartChallan = __decorate([
    (0, typeorm_1.Entity)('part_challans')
], PartChallan);
//# sourceMappingURL=challan.entity.js.map