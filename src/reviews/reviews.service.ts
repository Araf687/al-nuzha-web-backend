import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(@InjectRepository(Review) private repo: Repository<Review>) {}
  findApproved() { return this.repo.find({ where: { isApproved: true }, order: { createdAt: 'DESC' } }); }
  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }
  create(dto: any, customerId: string) {
    return this.repo.save(this.repo.create({ ...dto, customer: { id: customerId } as any }));
  }
  async approve(id: string) {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException();
    r.isApproved = true;
    return this.repo.save(r);
  }
}
