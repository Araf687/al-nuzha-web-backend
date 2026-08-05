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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const invoice_entity_1 = require("./entities/invoice.entity");
let InvoicesService = class InvoicesService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll(status) {
        const where = status ? { paymentStatus: status } : {};
        return this.repo.find({ where, order: { issuedAt: 'DESC' } });
    }
    findByCustomer(customerId) {
        return this.repo.find({
            where: { customer: { id: customerId } },
            order: { issuedAt: 'DESC' },
        });
    }
    async findOne(id) {
        const inv = await this.repo.findOne({
            where: { id },
            relations: ['customer', 'jobReport', 'jobReport.parts', 'jobReport.services', 'jobReport.expenses'],
        });
        if (!inv)
            throw new common_1.NotFoundException('Invoice not found');
        return inv;
    }
    async markPaid(id, method) {
        const inv = await this.findOne(id);
        inv.paymentStatus = invoice_entity_1.PaymentStatus.PAID;
        inv.paymentMethod = method;
        inv.paidAt = new Date();
        return this.repo.save(inv);
    }
    async getRevenueSummary() {
        return this.repo
            .createQueryBuilder('inv')
            .select("DATE_TRUNC('month', inv.issuedAt)", 'month')
            .addSelect('SUM(inv.total)', 'totalRevenue')
            .addSelect('SUM(CASE WHEN inv.paymentStatus = :paid THEN inv.total ELSE 0 END)', 'collectedRevenue')
            .addSelect('COUNT(inv.id)', 'invoiceCount')
            .setParameter('paid', invoice_entity_1.PaymentStatus.PAID)
            .groupBy("DATE_TRUNC('month', inv.issuedAt)")
            .orderBy("DATE_TRUNC('month', inv.issuedAt)", 'DESC')
            .limit(6)
            .getRawMany();
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(invoice_entity_1.Invoice)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map