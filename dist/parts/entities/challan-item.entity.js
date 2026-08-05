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
exports.ChallanItem = void 0;
const typeorm_1 = require("typeorm");
const challan_entity_1 = require("./challan.entity");
const part_entity_1 = require("./part.entity");
let ChallanItem = class ChallanItem {
};
exports.ChallanItem = ChallanItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ChallanItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => challan_entity_1.PartChallan, c => c.items, { onDelete: 'CASCADE' }),
    __metadata("design:type", challan_entity_1.PartChallan)
], ChallanItem.prototype, "challan", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => part_entity_1.Part, { eager: true, nullable: false }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", part_entity_1.Part)
], ChallanItem.prototype, "part", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], ChallanItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], ChallanItem.prototype, "unitPrice", void 0);
exports.ChallanItem = ChallanItem = __decorate([
    (0, typeorm_1.Entity)('challan_items')
], ChallanItem);
//# sourceMappingURL=challan-item.entity.js.map