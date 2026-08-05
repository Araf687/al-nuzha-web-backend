import { ServiceRequest } from '../../service-requests/entities/service-request.entity';
import { Technician } from '../../technicians/entities/technician.entity';
import { JobPart } from './job-part.entity';
import { JobService } from './job-service.entity';
import { JobExpense } from './job-expense.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
export declare class JobReport {
    id: string;
    serviceRequest: ServiceRequest;
    technician: Technician;
    faultFound: string;
    diagnosisNotes: string;
    labourCharge: number;
    partsTotal: number;
    extraExpensesTotal: number;
    vatAmount: number;
    grandTotal: number;
    customerSignatureUrl: string;
    arrivedAt: Date;
    completedAt: Date;
    createdAt: Date;
    parts: JobPart[];
    services: JobService[];
    expenses: JobExpense[];
    invoice: Invoice;
}
