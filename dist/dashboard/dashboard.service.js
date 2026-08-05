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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const service_request_entity_1 = require("../service-requests/entities/service-request.entity");
const invoice_entity_1 = require("../invoices/entities/invoice.entity");
const job_report_entity_1 = require("../job-reports/entities/job-report.entity");
const challan_entity_1 = require("../parts/entities/challan.entity");
const part_entity_1 = require("../parts/entities/part.entity");
const num = (v) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
};
const money = (v) => Math.round(num(v) * 100) / 100;
let DashboardService = class DashboardService {
    constructor(requestsRepo, invoicesRepo, reportsRepo, challansRepo, partsRepo) {
        this.requestsRepo = requestsRepo;
        this.invoicesRepo = invoicesRepo;
        this.reportsRepo = reportsRepo;
        this.challansRepo = challansRepo;
        this.partsRepo = partsRepo;
    }
    resolveRange(startDate, endDate) {
        const now = new Date();
        const start = startDate
            ? new Date(`${startDate}T00:00:00`)
            : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate
            ? new Date(`${endDate}T23:59:59.999`)
            : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const day = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return { start, end, startDay: day(start), endDay: day(end) };
    }
    async getSummary(startDate, endDate) {
        const { start, end, startDay, endDay } = this.resolveRange(startDate, endDate);
        const range = { start, end };
        const dayRange = { startDay, endDay };
        const [jobRows, invoiceAgg, revenueByMonth, challans, partsAddedByMonth, recentJobs, topTechnicians, lowStockCount, pendingReviewCount,] = await Promise.all([
            this.requestsRepo
                .createQueryBuilder('sr')
                .select('sr.status', 'status')
                .addSelect('COUNT(*)', 'count')
                .addSelect('SUM(CASE WHEN sr.isRecurring THEN 1 ELSE 0 END)', 'recurring')
                .where('sr.createdAt BETWEEN :start AND :end', range)
                .groupBy('sr.status')
                .getRawMany(),
            this.invoicesRepo
                .createQueryBuilder('inv')
                .select('COUNT(*)', 'invoiceCount')
                .addSelect('COALESCE(SUM(inv.total), 0)', 'billed')
                .addSelect('COALESCE(SUM(CASE WHEN inv.paymentStatus = :paid THEN inv.total ELSE 0 END), 0)', 'collected')
                .addSelect('COALESCE(SUM(inv.advanceAmount), 0)', 'advanceCollected')
                .where('inv.issuedAt BETWEEN :start AND :end', range)
                .setParameter('paid', invoice_entity_1.PaymentStatus.PAID)
                .getRawOne(),
            this.invoicesRepo
                .createQueryBuilder('inv')
                .select("TO_CHAR(DATE_TRUNC('month', inv.issuedAt), 'YYYY-MM')", 'month')
                .addSelect('COALESCE(SUM(inv.total), 0)', 'totalRevenue')
                .addSelect('COALESCE(SUM(CASE WHEN inv.paymentStatus = :paid THEN inv.total ELSE 0 END), 0)', 'collectedRevenue')
                .addSelect('COUNT(*)', 'invoiceCount')
                .where('inv.issuedAt BETWEEN :start AND :end', range)
                .setParameter('paid', invoice_entity_1.PaymentStatus.PAID)
                .groupBy("DATE_TRUNC('month', inv.issuedAt)")
                .orderBy("DATE_TRUNC('month', inv.issuedAt)", 'DESC')
                .getRawMany(),
            this.challansRepo
                .createQueryBuilder('c')
                .leftJoin('c.items', 'item')
                .select('c.id', 'id')
                .addSelect('c.challanNumber', 'challanNumber')
                .addSelect("TO_CHAR(c.purchaseDate, 'YYYY-MM-DD')", 'purchaseDate')
                .addSelect('c.supplierName', 'supplierName')
                .addSelect('COUNT(item.id)', 'itemCount')
                .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity')
                .addSelect('COALESCE(SUM(item.quantity * item.unitPrice), 0)', 'total')
                .where('c.purchaseDate BETWEEN :startDay AND :endDay', dayRange)
                .groupBy('c.id')
                .orderBy('c.purchaseDate', 'DESC')
                .getRawMany(),
            this.challansRepo
                .createQueryBuilder('c')
                .leftJoin('c.items', 'item')
                .select("TO_CHAR(DATE_TRUNC('month', c.purchaseDate), 'YYYY-MM')", 'month')
                .addSelect('COALESCE(SUM(item.quantity), 0)', 'qty')
                .addSelect('COALESCE(SUM(item.quantity * item.unitPrice), 0)', 'spend')
                .addSelect('COUNT(DISTINCT c.id)', 'challans')
                .groupBy("DATE_TRUNC('month', c.purchaseDate)")
                .orderBy("DATE_TRUNC('month', c.purchaseDate)", 'DESC')
                .limit(6)
                .getRawMany(),
            this.requestsRepo
                .createQueryBuilder('sr')
                .leftJoinAndSelect('sr.customer', 'customer')
                .leftJoinAndSelect('sr.assignedTechnician', 'tech')
                .leftJoinAndSelect('sr.jobReport', 'jobReport')
                .leftJoinAndSelect('jobReport.invoice', 'invoice')
                .where('sr.createdAt BETWEEN :start AND :end', range)
                .orderBy('sr.createdAt', 'DESC')
                .limit(8)
                .getMany(),
            this.reportsRepo
                .createQueryBuilder('jr')
                .select('tech.id', 'technicianId')
                .addSelect('tech.name', 'name')
                .addSelect('COUNT(jr.id)', 'jobsCompleted')
                .addSelect('COALESCE(SUM(jr.grandTotal), 0)', 'totalRevenue')
                .addSelect('AVG(EXTRACT(EPOCH FROM (jr.completedAt - jr.arrivedAt)) / 3600)', 'avgDurationHours')
                .leftJoin('jr.technician', 'tech')
                .where('jr.completedAt BETWEEN :start AND :end', range)
                .groupBy('tech.id')
                .addGroupBy('tech.name')
                .orderBy('COUNT(jr.id)', 'DESC')
                .limit(5)
                .getRawMany(),
            this.partsRepo
                .createQueryBuilder('p')
                .where('p.stockQty <= p.minStockLevel')
                .getCount(),
            this.partsRepo.count({ where: { needsReview: true } }),
        ]);
        const jobCount = (s) => num(jobRows.find((r) => r.status === s)?.count);
        const jobs = {
            total: jobRows.reduce((sum, r) => sum + num(r.count), 0),
            completed: jobCount(service_request_entity_1.RequestStatus.COMPLETED),
            pending: jobCount(service_request_entity_1.RequestStatus.PENDING),
            assigned: jobCount(service_request_entity_1.RequestStatus.ASSIGNED),
            inProgress: jobCount(service_request_entity_1.RequestStatus.IN_PROGRESS) + jobCount(service_request_entity_1.RequestStatus.ASSIGNED),
            cancelled: jobCount(service_request_entity_1.RequestStatus.CANCELLED),
            recurring: jobRows.reduce((sum, r) => sum + num(r.recurring), 0),
        };
        const billed = money(invoiceAgg?.billed);
        const collected = money(invoiceAgg?.collected);
        const purchases = challans.reduce((acc, c) => ({
            spend: acc.spend + num(c.total),
            partsAddedQty: acc.partsAddedQty + num(c.quantity),
        }), { spend: 0, partsAddedQty: 0 });
        return {
            range: { startDate: startDay, endDate: endDay },
            stats: {
                jobs,
                revenue: {
                    billed,
                    collected,
                    outstanding: money(billed - collected),
                    advanceCollected: money(invoiceAgg?.advanceCollected),
                    invoiceCount: num(invoiceAgg?.invoiceCount),
                },
                purchases: {
                    spend: money(purchases.spend),
                    challanCount: challans.length,
                    partsAddedQty: purchases.partsAddedQty,
                },
                inventory: {
                    lowStockCount,
                    pendingReviewCount,
                },
            },
            revenueByMonth: revenueByMonth.map((r) => ({
                month: r.month,
                totalRevenue: money(r.totalRevenue),
                collectedRevenue: money(r.collectedRevenue),
                invoiceCount: num(r.invoiceCount),
            })),
            partsAddedByMonth: partsAddedByMonth.map((r) => ({
                month: r.month,
                qty: num(r.qty),
                spend: money(r.spend),
                challans: num(r.challans),
            })),
            challans: challans.map((c) => ({
                id: c.id,
                challanNumber: c.challanNumber,
                purchaseDate: c.purchaseDate,
                supplierName: c.supplierName,
                itemCount: num(c.itemCount),
                quantity: num(c.quantity),
                total: money(c.total),
            })),
            topTechnicians: topTechnicians
                .filter((t) => t.technicianId)
                .map((t) => ({
                technicianId: t.technicianId,
                name: t.name,
                jobsCompleted: num(t.jobsCompleted),
                totalRevenue: money(t.totalRevenue),
                avgDurationHours: money(t.avgDurationHours),
            })),
            recentJobs: recentJobs.map((sr) => ({
                id: sr.id,
                jobRef: sr.jobRef,
                serviceType: sr.serviceType,
                address: sr.address,
                status: sr.status,
                isRecurring: sr.isRecurring,
                createdAt: sr.createdAt,
                customer: sr.customer ? { id: sr.customer.id, name: sr.customer.name, phone: sr.customer.phone } : null,
                technician: sr.assignedTechnician
                    ? { id: sr.assignedTechnician.id, name: sr.assignedTechnician.name }
                    : null,
                invoice: sr.jobReport?.invoice
                    ? {
                        id: sr.jobReport.invoice.id,
                        invoiceRef: sr.jobReport.invoice.invoiceRef,
                        total: money(sr.jobReport.invoice.total),
                        paymentStatus: sr.jobReport.invoice.paymentStatus,
                        paymentMethod: sr.jobReport.invoice.paymentMethod ?? null,
                        advanceAmount: money(sr.jobReport.invoice.advanceAmount),
                        issuedAt: sr.jobReport.invoice.issuedAt,
                    }
                    : null,
            })),
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_request_entity_1.ServiceRequest)),
    __param(1, (0, typeorm_1.InjectRepository)(invoice_entity_1.Invoice)),
    __param(2, (0, typeorm_1.InjectRepository)(job_report_entity_1.JobReport)),
    __param(3, (0, typeorm_1.InjectRepository)(challan_entity_1.PartChallan)),
    __param(4, (0, typeorm_1.InjectRepository)(part_entity_1.Part)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map