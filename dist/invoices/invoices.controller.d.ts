import { InvoicesService } from './invoices.service';
import { PaymentStatus } from './entities/invoice.entity';
declare class MarkPaidDto {
    paymentMethod: string;
}
export declare class InvoicesController {
    private svc;
    constructor(svc: InvoicesService);
    findAll(status?: PaymentStatus): Promise<import("./entities/invoice.entity").Invoice[]>;
    myInvoices(req: any): Promise<import("./entities/invoice.entity").Invoice[]>;
    revenue(): Promise<any[]>;
    findOne(id: string): Promise<import("./entities/invoice.entity").Invoice>;
    markPaid(id: string, dto: MarkPaidDto): Promise<import("./entities/invoice.entity").Invoice>;
}
export {};
