import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
export declare class ReviewsService {
    private repo;
    constructor(repo: Repository<Review>);
    findApproved(): Promise<Review[]>;
    findAll(): Promise<Review[]>;
    create(dto: any, customerId: string): Promise<Review[]>;
    approve(id: string): Promise<Review>;
}
