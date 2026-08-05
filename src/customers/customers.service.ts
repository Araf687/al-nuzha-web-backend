import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CustomersService {
  constructor(@InjectRepository(Customer) private repo: Repository<Customer>) {}

  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }

  async findOne(id: string) {
    const c = await this.repo.findOne({ where: { id }, relations: ['serviceRequests', 'invoices'] });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async update(id: string, dto: Partial<Customer>) {
    const c = await this.findOne(id);
    Object.assign(c, dto);
    return this.repo.save(c);
  }

  async resetPassword(id: string, newPassword: string) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Customer not found');
    c.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.repo.save(c);
    return { message: 'Password reset successfully' };
  }
}
