import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private svc;
    constructor(svc: ReviewsService);
    findApproved(): Promise<import("./entities/review.entity").Review[]>;
    findAll(): Promise<import("./entities/review.entity").Review[]>;
    create(dto: any, req: any): Promise<import("./entities/review.entity").Review[]>;
    approve(id: string): Promise<import("./entities/review.entity").Review>;
}
