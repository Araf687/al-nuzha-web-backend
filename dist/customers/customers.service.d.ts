import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
export declare class CustomersService {
    private repo;
    constructor(repo: Repository<Customer>);
    findAll(): Promise<Customer[]>;
    findOne(id: string): Promise<Customer>;
    update(id: string, dto: Partial<Customer>): Promise<Customer>;
    resetPassword(id: string, newPassword: string): Promise<{
        message: string;
    }>;
}
