import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { Service } from './entities/service.entity';

type ServiceInput = Partial<Pick<Service, 'title' | 'startingPrice' | 'isCustomQuote' | 'priority' | 'thumbnail'>>;

@Injectable()
export class ServicesService {
  constructor(@InjectRepository(Service) private repo: Repository<Service>) {}

  findAll() { return this.repo.find({ order: { priority: 'ASC', createdAt: 'DESC' } }); }

  async findOne(id: string) {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Service not found');
    return s;
  }

  create(dto: ServiceInput) {
    const s = this.repo.create(dto);
    this.applyPriceRule(s);
    return this.repo.save(s);
  }

  async update(id: string, dto: ServiceInput) {
    const s = await this.findOne(id);
    const oldThumbnail = s.thumbnail;
    Object.assign(s, dto);
    this.applyPriceRule(s);
    const saved = await this.repo.save(s);
    if (dto.thumbnail && oldThumbnail !== dto.thumbnail) await this.removeFile(oldThumbnail);
    return saved;
  }

  async remove(id: string) {
    const s = await this.findOne(id);
    await this.repo.remove(s);
    await this.removeFile(s.thumbnail);
    return { message: 'Service deleted successfully' };
  }

  // Custom-quote services have no starting price; all others must have one.
  private applyPriceRule(s: Service) {
    if (s.isCustomQuote) {
      s.startingPrice = null;
    } else if (s.startingPrice === null || s.startingPrice === undefined) {
      throw new BadRequestException('startingPrice is required unless isCustomQuote is true');
    }
  }

  // Deletes an uploaded file given its public path (/uploads/...); ignores missing files.
  async removeFile(publicPath?: string) {
    if (!publicPath?.startsWith('/uploads/')) return;
    await unlink(join(process.cwd(), publicPath)).catch(() => undefined);
  }
}
