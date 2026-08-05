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
exports.PartsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const part_entity_1 = require("./entities/part.entity");
const challan_entity_1 = require("./entities/challan.entity");
const challan_item_entity_1 = require("./entities/challan-item.entity");
let PartsService = class PartsService {
    constructor(repo, challanRepo, challanItemRepo) {
        this.repo = repo;
        this.challanRepo = challanRepo;
        this.challanItemRepo = challanItemRepo;
    }
    findAll() { return this.repo.find({ order: { name: 'ASC' } }); }
    async findOne(id) {
        const p = await this.repo.findOne({ where: { id } });
        if (!p)
            throw new common_1.NotFoundException('Part not found');
        return p;
    }
    create(dto) { return this.repo.save(this.repo.create(dto)); }
    async update(id, dto) {
        const part = await this.findOne(id);
        Object.assign(part, dto);
        return this.repo.save(part);
    }
    getLowStock() {
        return this.repo
            .createQueryBuilder('p')
            .where('p.stockQty <= p.minStockLevel')
            .getMany();
    }
    getPendingReview() { return this.repo.find({ where: { needsReview: true } }); }
    async approveCustomPart(id, updates) {
        const part = await this.findOne(id);
        Object.assign(part, updates, { needsReview: false });
        return this.repo.save(part);
    }
    async bulkCreate(rows) {
        const created = [];
        const errors = [];
        for (let i = 0; i < rows.length; i++) {
            try {
                const part = await this.create(rows[i]);
                created.push(part);
            }
            catch (e) {
                errors.push({
                    row: i + 1,
                    name: rows[i].name ?? '?',
                    error: e instanceof Error ? e.message : 'Unknown error',
                });
            }
        }
        return { created, errors };
    }
    async setRemainingQty(id, qty) {
        if (qty < 0)
            throw new common_1.BadRequestException('Quantity cannot be negative');
        const part = await this.findOne(id);
        part.stockQty = qty;
        return this.repo.save(part);
    }
    async createChallan(dto) {
        if (!dto.items || dto.items.length === 0) {
            throw new common_1.BadRequestException('Challan must have at least one item');
        }
        const challanItems = [];
        for (const i of dto.items) {
            const part = await this.findOne(i.partId);
            part.stockQty += i.quantity;
            await this.repo.save(part);
            const item = this.challanItemRepo.create({
                part,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
            });
            challanItems.push(item);
        }
        const challan = this.challanRepo.create({
            challanNumber: dto.challanNumber,
            purchaseDate: dto.purchaseDate,
            supplierName: dto.supplierName,
            items: challanItems,
        });
        return this.challanRepo.save(challan);
    }
    async bulkCreateChallans(challans) {
        const created = [];
        const errors = [];
        for (const c of challans) {
            try {
                const items = [];
                for (const item of c.items) {
                    const part = await this.repo.findOne({ where: { sku: item.partSku } });
                    if (!part)
                        throw new Error(`Part SKU "${item.partSku}" not found in catalogue`);
                    items.push({ partId: part.id, quantity: item.quantity, unitPrice: item.unitPrice });
                }
                const challan = await this.createChallan({
                    challanNumber: c.challanNumber,
                    purchaseDate: c.purchaseDate,
                    supplierName: c.supplierName,
                    items,
                });
                created.push(challan);
            }
            catch (e) {
                errors.push({
                    challanNumber: c.challanNumber,
                    error: e instanceof Error ? e.message : 'Unknown error',
                });
            }
        }
        return { created, errors };
    }
    findAllChallans() {
        return this.challanRepo.find({ order: { createdAt: 'DESC' } });
    }
    async findOneChallan(id) {
        const c = await this.challanRepo.findOne({ where: { id } });
        if (!c)
            throw new common_1.NotFoundException('Challan not found');
        return c;
    }
};
exports.PartsService = PartsService;
exports.PartsService = PartsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(part_entity_1.Part)),
    __param(1, (0, typeorm_1.InjectRepository)(challan_entity_1.PartChallan)),
    __param(2, (0, typeorm_1.InjectRepository)(challan_item_entity_1.ChallanItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PartsService);
//# sourceMappingURL=parts.service.js.map