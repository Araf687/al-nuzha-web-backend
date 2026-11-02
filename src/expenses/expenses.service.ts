import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';

type ExpenseInput = Partial<Pick<Expense, 'cost' | 'shopName' | 'shopNumber' | 'description' | 'spentAt'>>;

export interface ExpenseQuery {
  from?: string;
  to?: string;
  // Filter by shop, partial match
  shopName?: string;
  // Set for technicians, so they only ever see their own expenses; admins leave it empty
  technicianId?: string;
}

// Only these technician fields go out in responses — never the password hash
const TECHNICIAN_FIELDS = { id: true, name: true, phone: true } as const;
const SELECT = {
  id: true,
  cost: true,
  shopName: true,
  shopNumber: true,
  description: true,
  spentAt: true,
  createdAt: true,
  technician: TECHNICIAN_FIELDS,
} as const;

function money(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

@Injectable()
export class ExpensesService {
  constructor(@InjectRepository(Expense) private repo: Repository<Expense>) {}

  findAll({ from, to, shopName, technicianId }: ExpenseQuery = {}) {
    const spentAt =
      from && to ? Between(from, to) : from ? MoreThanOrEqual(from) : to ? LessThanOrEqual(to) : undefined;
    return this.repo.find({
      where: {
        ...(spentAt && { spentAt }),
        ...(shopName && { shopName: ILike(`%${shopName}%`) }),
        ...(technicianId && { technician: { id: technicianId } }),
      },
      relations: { technician: true },
      select: SELECT,
      order: { spentAt: 'DESC', createdAt: 'DESC' },
    });
  }

  // technicianId limits the lookup to that technician's own expenses
  async findOne(id: string, technicianId?: string) {
    const expense = await this.repo.findOne({
      where: { id },
      relations: { technician: true },
      select: SELECT,
    });
    if (!expense) throw new NotFoundException('Expense not found');
    if (technicianId && expense.technician?.id !== technicianId) {
      throw new ForbiddenException('You can only access your own expenses');
    }
    return expense;
  }

  async create(dto: ExpenseInput, technicianId: string) {
    const saved = await this.repo.save(
      this.repo.create({ ...dto, technician: { id: technicianId } as never }),
    );
    return this.findOne(saved.id);
  }

  // moveTo reassigns the expense to another technician (admin only — the controller decides)
  async update(id: string, dto: ExpenseInput, technicianId?: string, moveTo?: string) {
    const expense = await this.findOne(id, technicianId);
    Object.assign(expense, dto);
    if (moveTo) expense.technician = { id: moveTo } as never;
    await this.repo.save(expense);
    return this.findOne(id);
  }

  async remove(id: string, technicianId?: string) {
    const expense = await this.findOne(id, technicianId);
    await this.repo.remove(expense);
    return { message: 'Expense deleted successfully' };
  }

  // Totals for the whole log, or for a date range / one technician
  async getSummary({ from, to, technicianId }: ExpenseQuery = {}) {
    const qb = this.repo
      .createQueryBuilder('e')
      .select('COUNT(*)', 'entries')
      .addSelect('COALESCE(SUM(e.cost), 0)', 'totalCost');

    if (from) qb.andWhere('e.spentAt >= :from', { from });
    if (to) qb.andWhere('e.spentAt <= :to', { to });
    if (technicianId) qb.andWhere('e.technicianId = :technicianId', { technicianId });

    const row = await qb.getRawOne<{ entries: string; totalCost: string }>();
    const entries = Number(row?.entries ?? 0);
    const totalCost = money(row?.totalCost);

    return {
      from: from ?? null,
      to: to ?? null,
      entries,
      totalCost,
      avgCost: entries > 0 ? money(totalCost / entries) : 0,
    };
  }

  // Spend per calendar month, newest month first
  async getMonthly({ from, to, technicianId }: ExpenseQuery = {}) {
    const qb = this.repo
      .createQueryBuilder('e')
      .select("TO_CHAR(DATE_TRUNC('month', e.spentAt), 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'entries')
      .addSelect('COALESCE(SUM(e.cost), 0)', 'totalCost')
      .groupBy("DATE_TRUNC('month', e.spentAt)")
      .orderBy("DATE_TRUNC('month', e.spentAt)", 'DESC');

    if (from) qb.andWhere('e.spentAt >= :from', { from });
    if (to) qb.andWhere('e.spentAt <= :to', { to });
    if (technicianId) qb.andWhere('e.technicianId = :technicianId', { technicianId });

    const rows = await qb.getRawMany<{ month: string; entries: string; totalCost: string }>();

    return rows.map((r) => ({
      month: r.month,
      entries: Number(r.entries),
      totalCost: money(r.totalCost),
    }));
  }

  // Spend per shop over the range, biggest spend first
  async getByShop({ from, to, technicianId }: ExpenseQuery = {}) {
    const qb = this.repo
      .createQueryBuilder('e')
      .select('e.shopName', 'shopName')
      .addSelect('COUNT(*)', 'entries')
      .addSelect('COALESCE(SUM(e.cost), 0)', 'totalCost')
      .groupBy('e.shopName')
      .orderBy('SUM(e.cost)', 'DESC');

    if (from) qb.andWhere('e.spentAt >= :from', { from });
    if (to) qb.andWhere('e.spentAt <= :to', { to });
    if (technicianId) qb.andWhere('e.technicianId = :technicianId', { technicianId });

    const rows = await qb.getRawMany<{ shopName: string; entries: string; totalCost: string }>();

    return rows.map((r) => ({
      shopName: r.shopName,
      entries: Number(r.entries),
      totalCost: money(r.totalCost),
    }));
  }
}
