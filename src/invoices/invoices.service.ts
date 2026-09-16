import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, PaymentStatus } from './entities/invoice.entity';

@Injectable()
export class InvoicesService {
  constructor(@InjectRepository(Invoice) private repo: Repository<Invoice>) {}

  findAll(status?: PaymentStatus) {
    const where = status ? { paymentStatus: status } : {};
    return this.repo.find({ where, order: { issuedAt: 'DESC' } });
  }

  findByCustomer(customerId: string) {
    return this.repo.find({
      where: { customer: { id: customerId } },
      order: { issuedAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const inv = await this.repo.findOne({
      where: { id },
      relations: ['customer', 'jobReport', 'jobReport.parts', 'jobReport.services', 'jobReport.expenses'],
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async markPaid(id: string, method: string) {
    const inv = await this.findOne(id);
    inv.paymentStatus = PaymentStatus.PAID;
    inv.paymentMethod = method;
    inv.paidAt = new Date();
    return this.repo.save(inv);
  }

  async updatePayment(
    id: string,
    dto: { paymentStatus: PaymentStatus; amountPaid?: number; paymentMethod?: string },
  ) {
    const inv = await this.findOne(id);
    const totalCents = Math.round(Number(inv.total) * 100);

    switch (dto.paymentStatus) {
      case PaymentStatus.PAID:
        // Keep the original paid date if it was already paid
        if (inv.paymentStatus !== PaymentStatus.PAID || !inv.paidAt) inv.paidAt = new Date();
        break;

      case PaymentStatus.PARTIAL: {
        const paidCents = Math.round(Number(dto.amountPaid) * 100);
        if (!Number.isFinite(paidCents) || paidCents <= 0) {
          throw new BadRequestException('amountPaid is required for a partial payment');
        }
        if (paidCents >= totalCents) {
          throw new BadRequestException('amountPaid covers the full total — mark the invoice as paid instead');
        }
        inv.advanceAmount = paidCents / 100;
        inv.paidAt = null;
        break;
      }

      case PaymentStatus.UNPAID:
        inv.advanceAmount = 0;
        inv.paidAt = null;
        break;
    }

    inv.paymentStatus = dto.paymentStatus;
    if (dto.paymentMethod) inv.paymentMethod = dto.paymentMethod;
    return this.repo.save(inv);
  }

  async getRevenueSummary() {
    return this.repo
      .createQueryBuilder('inv')
      .select("DATE_TRUNC('month', inv.issuedAt)", 'month')
      .addSelect('SUM(inv.total)', 'totalRevenue')
      .addSelect('SUM(CASE WHEN inv.paymentStatus = :paid THEN inv.total ELSE 0 END)', 'collectedRevenue')
      .addSelect('COUNT(inv.id)', 'invoiceCount')
      .setParameter('paid', PaymentStatus.PAID)
      .groupBy("DATE_TRUNC('month', inv.issuedAt)")
      .orderBy("DATE_TRUNC('month', inv.issuedAt)", 'DESC')
      .limit(6)
      .getRawMany();
  }
}
