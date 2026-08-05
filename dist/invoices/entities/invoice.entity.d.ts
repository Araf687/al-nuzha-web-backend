import { Customer } from '../../customers/entities/customer.entity';
import { JobReport } from '../../job-reports/entities/job-report.entity';
export declare enum PaymentStatus {
    UNPAID = "unpaid",
    PAID = "paid",
    PARTIAL = "partial"
}
export declare class Invoice {
    id: string;
    invoiceRef: string;
    jobReport: JobReport;
    customer: Customer;
    subtotal: number;
    vat: number;
    total: number;
    paymentStatus: PaymentStatus;
    paymentMethod: string;
    advanceAmount: number;
    pdfUrl: string;
    issuedAt: Date;
    paidAt: Date;
}
