import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Technician } from './entities/technician.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TechniciansService {
  constructor(@InjectRepository(Technician) private repo: Repository<Technician>) {}

  findAll() {
    return this.repo.find({
      where: { isActive: true },
      select: ['id', 'name', 'phone', 'email', 'role', 'isActive', 'createdAt'],
    });
  }

  async findOne(id: string) {
    const t = await this.repo.findOne({
      where: { id },
      select: ['id', 'name', 'phone', 'email', 'role', 'isActive', 'createdAt'],
    });
    if (!t) throw new NotFoundException('Technician not found');
    return t;
  }

  async create(dto: { name: string; phone: string; email?: string; password: string; role?: string }) {
    const exists = await this.repo.findOne({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('Phone number already registered');

    const hash = await bcrypt.hash(dto.password, 10);
    const t = this.repo.create({
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      passwordHash: hash,
      role: dto.role || 'technician',
    });
    const saved = await this.repo.save(t);
    const { passwordHash: _, ...result } = saved;
    return result;
  }

  async update(id: string, dto: { name?: string; email?: string; role?: string; isActive?: boolean }) {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Technician not found');
    Object.assign(t, dto);
    const saved = await this.repo.save(t);
    const { passwordHash: _, ...result } = saved;
    return result;
  }

  async resetPassword(id: string, newPassword: string) {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Technician not found');
    t.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.repo.save(t);
    return { message: 'Password reset successfully' };
  }

  async savePushToken(id: string, expoPushToken: string) {
    await this.repo.update(id, { expoPushToken });
    return { message: 'Push token saved' };
  }
}
