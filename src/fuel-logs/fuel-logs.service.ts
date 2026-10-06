import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { FuelLog } from './entities/fuel-log.entity';

type FuelLogInput = Partial<Pick<FuelLog, 'litres' | 'cost' | 'filledAt'>>;

export interface FuelLogQuery {
  from?: string;
  to?: string;
  // Set for technicians, so they only ever see their own refills; admins leave it empty
  technicianId?: string;
}

// Only these technician fields go out in responses — never the password hash
const TECHNICIAN_FIELDS = { id: true, name: true, phone: true } as const;
const SELECT = {
  id: true,
  litres: true,
  cost: true,
  filledAt: true,
  createdAt: true,
  technician: TECHNICIAN_FIELDS,
} as const;

function money(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

@Injectable()
export class FuelLogsService {
  constructor(@InjectRepository(FuelLog) private repo: Repository<FuelLog>) {}

  findAll({ from, to, technicianId }: FuelLogQuery = {}) {
    const filledAt =
      from && to ? Between(from, to) : from ? MoreThanOrEqual(from) : to ? LessThanOrEqual(to) : undefined;
    return this.repo.find({
      where: {
        ...(filledAt && { filledAt }),
        ...(technicianId && { technician: { id: technicianId } }),
      },
      relations: { technician: true },
      select: SELECT,
      order: { filledAt: 'DESC', createdAt: 'DESC' },
    });
  }

  // technicianId limits the lookup to that technician's own refills
  async findOne(id: string, technicianId?: string) {
    const log = await this.repo.findOne({
      where: { id },
      relations: { technician: true },
      select: SELECT,
    });
    if (!log) throw new NotFoundException('Fuel log not found');
    if (technicianId && log.technician?.id !== technicianId) {
      throw new ForbiddenException('You can only access your own fuel logs');
    }
    return log;
  }

  async create(dto: FuelLogInput, technicianId: string) {
    const saved = await this.repo.save(
      this.repo.create({ ...dto, technician: { id: technicianId } as never }),
    );
    return this.findOne(saved.id);
  }

  // moveTo reassigns the refill to another technician (admin only — the controller decides)
  async update(id: string, dto: FuelLogInput, technicianId?: string, moveTo?: string) {
    const log = await this.findOne(id, technicianId);
    Object.assign(log, dto);
    if (moveTo) log.technician = { id: moveTo } as never;
    await this.repo.save(log);
    return this.findOne(id);
  }

  async remove(id: string, technicianId?: string) {
    const log = await this.findOne(id, technicianId);
    await this.repo.remove(log);
    return { message: 'Fuel log deleted successfully' };
  }

  // Totals for the whole log, or for a date range / one technician
  async getSummary({ from, to, technicianId }: FuelLogQuery = {}) {
    const qb = this.repo
      .createQueryBuilder('f')
      .select('COUNT(*)', 'refills')
      .addSelect('COALESCE(SUM(f.litres), 0)', 'totalLitres')
      .addSelect('COALESCE(SUM(f.cost), 0)', 'totalCost');

    if (from) qb.andWhere('f.filledAt >= :from', { from });
    if (to) qb.andWhere('f.filledAt <= :to', { to });
    if (technicianId) qb.andWhere('f.technicianId = :technicianId', { technicianId });

    const row = await qb.getRawOne<{ refills: string; totalLitres: string; totalCost: string }>();

    const totalLitres = money(row?.totalLitres);
    const totalCost = money(row?.totalCost);

    return {
      from: from ?? null,
      to: to ?? null,
      refills: Number(row?.refills ?? 0),
      totalLitres,
      totalCost,
      // Average price paid per litre over the range
      avgCostPerLitre: totalLitres > 0 ? money(totalCost / totalLitres) : 0,
    };
  }
}
