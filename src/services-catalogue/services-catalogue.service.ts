import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCatalogue } from './entities/service-catalogue.entity';

@Injectable()
export class ServicesCatalogueService {
  constructor(@InjectRepository(ServiceCatalogue) private repo: Repository<ServiceCatalogue>) {}
  findAll() { return this.repo.find({ where: { isActive: true }, order: { displayOrder: 'ASC' } }); }
  findAllAdmin() { return this.repo.find({ order: { displayOrder: 'ASC' } }); }
  create(dto: Partial<ServiceCatalogue>) { return this.repo.save(this.repo.create(dto)); }
  async update(id: string, dto: Partial<ServiceCatalogue>) {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException();
    return this.repo.save(Object.assign(s, dto));
  }
}
