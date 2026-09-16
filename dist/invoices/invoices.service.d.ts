import { Repository } from 'typeorm';
import { Invoice, PaymentStatus } from './entities/invoice.entity';
export declare class InvoicesService {
    private repo;
    constructor(repo: Repository<Invoice>);
    findAll(status?: PaymentStatus): Promise<Invoice[]>;
    findByCustomer(customerId: string): Promise<Invoice[]>;
    findOne(id: string): Promise<Invoice>;
    markPaid(id: string, method: string): Promise<Invoice>;
    updatePayment(id: string, dto: {
        paymentStatus: PaymentStatus;
        amountPaid?: number;
        paymentMethod?: string;
    }): Promise<Invoice>;
    getRevenueSummary(): Promise<any[]>;
}
