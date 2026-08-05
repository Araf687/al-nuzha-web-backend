import { Customer } from '../../customers/entities/customer.entity';
export declare class Review {
    id: string;
    customer: Customer;
    stars: number;
    comment: string;
    isApproved: boolean;
    createdAt: Date;
}
