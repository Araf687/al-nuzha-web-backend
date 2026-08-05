import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Part } from './entities/part.entity';
import { PartChallan } from './entities/challan.entity';
import { ChallanItem } from './entities/challan-item.entity';

@Injectable()
export class PartsService {
  constructor(
    @InjectRepository(Part) private repo: Repository<Part>,
    @InjectRepository(PartChallan) private challanRepo: Repository<PartChallan>,
    @InjectRepository(ChallanItem) private challanItemRepo: Repository<ChallanItem>,
  ) {}

  findAll() { return this.repo.find({ order: { name: 'ASC' } }); }

  async findOne(id: string) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Part not found');
    return p;
  }

  create(dto: Partial<Part>) { return this.repo.save(this.repo.create(dto)); }

  async update(id: string, dto: Partial<Part>) {
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

  async approveCustomPart(id: string, updates: Partial<Part>) {
    const part = await this.findOne(id);
    Object.assign(part, updates, { needsReview: false });
    return this.repo.save(part);
  }

  // Admin sets actual remaining qty at end of month
  async bulkCreate(rows: Partial<Part>[]) {
    const created: Part[] = [];
    const errors: { row: number; name: string; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const part = await this.create(rows[i]);
        created.push(part);
      } catch (e: unknown) {
        errors.push({
          row: i + 1,
          name: rows[i].name ?? '?',
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }

    return { created, errors };
  }

  async setRemainingQty(id: string, qty: number) {
    if (qty < 0) throw new BadRequestException('Quantity cannot be negative');
    const part = await this.findOne(id);
    part.stockQty = qty;
    return this.repo.save(part);
  }

  // Create purchase challan — increments stock for each item
  async createChallan(dto: {
    challanNumber: string;
    purchaseDate: string;
    supplierName?: string;
    items: { partId: string; quantity: number; unitPrice: number }[];
  }) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Challan must have at least one item');
    }

    const challanItems: ChallanItem[] = [];

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

  async bulkCreateChallans(challans: {
    challanNumber: string;
    purchaseDate: string;
    supplierName?: string;
    items: { partSku: string; quantity: number; unitPrice: number }[];
  }[]) {
    const created: PartChallan[] = [];
    const errors: { challanNumber: string; error: string }[] = [];

    for (const c of challans) {
      try {
        const items: { partId: string; quantity: number; unitPrice: number }[] = [];
        for (const item of c.items) {
          const part = await this.repo.findOne({ where: { sku: item.partSku } });
          if (!part) throw new Error(`Part SKU "${item.partSku}" not found in catalogue`);
          items.push({ partId: part.id, quantity: item.quantity, unitPrice: item.unitPrice });
        }
        const challan = await this.createChallan({
          challanNumber: c.challanNumber,
          purchaseDate: c.purchaseDate,
          supplierName: c.supplierName,
          items,
        });
        created.push(challan);
      } catch (e: unknown) {
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

  async findOneChallan(id: string) {
    const c = await this.challanRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Challan not found');
    return c;
  }
}
