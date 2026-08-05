import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequest, RequestStatus } from '../service-requests/entities/service-request.entity';
import { Invoice, PaymentStatus } from '../invoices/entities/invoice.entity';
import { JobReport } from '../job-reports/entities/job-report.entity';
import { PartChallan } from '../parts/entities/challan.entity';
import { Part } from '../parts/entities/part.entity';

const num = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/** Money/decimal values — SUM of NUMERIC arrives as string; rounding kills float drift. */
const money = (v: unknown) => Math.round(num(v) * 100) / 100;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ServiceRequest) private requestsRepo: Repository<ServiceRequest>,
    @InjectRepository(Invoice) private invoicesRepo: Repository<Invoice>,
    @InjectRepository(JobReport) private reportsRepo: Repository<JobReport>,
    @InjectRepository(PartChallan) private challansRepo: Repository<PartChallan>,
    @InjectRepository(Part) private partsRepo: Repository<Part>,
  ) {}

  /**
   * Resolves the requested window. Defaults to current-month-start → today,
   * matching the admin dashboard's default filter.
   */
  private resolveRange(startDate?: string, endDate?: string) {
    const now = new Date();
    const start = startDate
      ? new Date(`${startDate}T00:00:00`)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate
      ? new Date(`${endDate}T23:59:59.999`)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // purchaseDate is a DATE column — compare against plain YYYY-MM-DD strings
    const day = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return { start, end, startDay: day(start), endDay: day(end) };
  }

  async getSummary(startDate?: string, endDate?: string) {
    const { start, end, startDay, endDay } = this.resolveRange(startDate, endDate);
    const range = { start, end };
    const dayRange = { startDay, endDay };

    const [
      jobRows,
      invoiceAgg,
      revenueByMonth,
      challans,
      partsAddedByMonth,
      recentJobs,
      topTechnicians,
      lowStockCount,
      pendingReviewCount,
    ] = await Promise.all([
      // ── Jobs grouped by status, within range ──────────────────────────
      this.requestsRepo
        .createQueryBuilder('sr')
        .select('sr.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(CASE WHEN sr.isRecurring THEN 1 ELSE 0 END)', 'recurring')
        .where('sr.createdAt BETWEEN :start AND :end', range)
        .groupBy('sr.status')
        .getRawMany<{ status: string; count: string; recurring: string }>(),

      // ── Invoice totals, within range ──────────────────────────────────
      this.invoicesRepo
        .createQueryBuilder('inv')
        .select('COUNT(*)', 'invoiceCount')
        .addSelect('COALESCE(SUM(inv.total), 0)', 'billed')
        .addSelect(
          'COALESCE(SUM(CASE WHEN inv.paymentStatus = :paid THEN inv.total ELSE 0 END), 0)',
          'collected',
        )
        .addSelect('COALESCE(SUM(inv.advanceAmount), 0)', 'advanceCollected')
        .where('inv.issuedAt BETWEEN :start AND :end', range)
        .setParameter('paid', PaymentStatus.PAID)
        .getRawOne<{ invoiceCount: string; billed: string; collected: string; advanceCollected: string }>(),

      // ── Revenue per month, within range ───────────────────────────────
      this.invoicesRepo
        .createQueryBuilder('inv')
        .select("TO_CHAR(DATE_TRUNC('month', inv.issuedAt), 'YYYY-MM')", 'month')
        .addSelect('COALESCE(SUM(inv.total), 0)', 'totalRevenue')
        .addSelect(
          'COALESCE(SUM(CASE WHEN inv.paymentStatus = :paid THEN inv.total ELSE 0 END), 0)',
          'collectedRevenue',
        )
        .addSelect('COUNT(*)', 'invoiceCount')
        .where('inv.issuedAt BETWEEN :start AND :end', range)
        .setParameter('paid', PaymentStatus.PAID)
        .groupBy("DATE_TRUNC('month', inv.issuedAt)")
        .orderBy("DATE_TRUNC('month', inv.issuedAt)", 'DESC')
        .getRawMany<{ month: string; totalRevenue: string; collectedRevenue: string; invoiceCount: string }>(),

      // ── Challans (purchase history), within range ─────────────────────
      this.challansRepo
        .createQueryBuilder('c')
        .leftJoin('c.items', 'item')
        .select('c.id', 'id')
        .addSelect('c.challanNumber', 'challanNumber')
        // purchaseDate is a DATE column — keep it a plain YYYY-MM-DD string.
        // Without TO_CHAR the pg driver hands back a Date, which serialises to
        // an ISO timestamp and renders a day early in any timezone east of UTC.
        .addSelect("TO_CHAR(c.purchaseDate, 'YYYY-MM-DD')", 'purchaseDate')
        .addSelect('c.supplierName', 'supplierName')
        .addSelect('COUNT(item.id)', 'itemCount')
        .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity')
        .addSelect('COALESCE(SUM(item.quantity * item.unitPrice), 0)', 'total')
        .where('c.purchaseDate BETWEEN :startDay AND :endDay', dayRange)
        .groupBy('c.id')
        .orderBy('c.purchaseDate', 'DESC')
        .getRawMany<{
          id: string; challanNumber: string; purchaseDate: string; supplierName: string | null;
          itemCount: string; quantity: string; total: string;
        }>(),

      // ── Parts added per month — last 6 months, NOT range-filtered ─────
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
        .getRawMany<{ month: string; qty: string; spend: string; challans: string }>(),

      // ── Recent jobs, within range ─────────────────────────────────────
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

      // ── Top technicians by jobs completed, within range ───────────────
      this.reportsRepo
        .createQueryBuilder('jr')
        .select('tech.id', 'technicianId')
        .addSelect('tech.name', 'name')
        .addSelect('COUNT(jr.id)', 'jobsCompleted')
        .addSelect('COALESCE(SUM(jr.grandTotal), 0)', 'totalRevenue')
        .addSelect(
          'AVG(EXTRACT(EPOCH FROM (jr.completedAt - jr.arrivedAt)) / 3600)',
          'avgDurationHours',
        )
        .leftJoin('jr.technician', 'tech')
        .where('jr.completedAt BETWEEN :start AND :end', range)
        .groupBy('tech.id')
        .addGroupBy('tech.name')
        .orderBy('COUNT(jr.id)', 'DESC')
        .limit(5)
        .getRawMany<{
          technicianId: string; name: string; jobsCompleted: string;
          totalRevenue: string; avgDurationHours: string | null;
        }>(),

      // ── Inventory health (current, not range-scoped) ──────────────────
      this.partsRepo
        .createQueryBuilder('p')
        .where('p.stockQty <= p.minStockLevel')
        .getCount(),

      this.partsRepo.count({ where: { needsReview: true } }),
    ]);

    // ── Fold job status rows ────────────────────────────────────────────
    const jobCount = (s: RequestStatus) => num(jobRows.find((r) => r.status === s)?.count);
    const jobs = {
      total:      jobRows.reduce((sum, r) => sum + num(r.count), 0),
      completed:  jobCount(RequestStatus.COMPLETED),
      pending:    jobCount(RequestStatus.PENDING),
      assigned:   jobCount(RequestStatus.ASSIGNED),
      inProgress: jobCount(RequestStatus.IN_PROGRESS) + jobCount(RequestStatus.ASSIGNED),
      cancelled:  jobCount(RequestStatus.CANCELLED),
      recurring:  jobRows.reduce((sum, r) => sum + num(r.recurring), 0),
    };

    const billed = money(invoiceAgg?.billed);
    const collected = money(invoiceAgg?.collected);

    const purchases = challans.reduce(
      (acc, c) => ({
        spend: acc.spend + num(c.total),
        partsAddedQty: acc.partsAddedQty + num(c.quantity),
      }),
      { spend: 0, partsAddedQty: 0 },
    );

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

      // Explicit projection — never spread the entity, it carries customer.passwordHash
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
}
