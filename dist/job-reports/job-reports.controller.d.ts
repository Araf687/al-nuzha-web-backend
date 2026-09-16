import { JobReportsService } from './job-reports.service';
import { RequestSource } from '../service-requests/entities/service-request.entity';
declare class JobPartDto {
    partId?: string;
    customPartName?: string;
    quantity: number;
    unitPrice: number;
}
declare class JobServiceDto {
    serviceName: string;
    labourCost: number;
    notes?: string;
}
declare class JobExpenseDto {
    description: string;
    amount: number;
}
declare class SubmitJobReportDto {
    faultFound: string;
    diagnosisNotes?: string;
    labourCharge: number;
    paymentType: string;
    advanceAmount?: number;
    customerSignatureUrl?: string;
    arrivedAt?: string;
    parts: JobPartDto[];
    services: JobServiceDto[];
    expenses: JobExpenseDto[];
}
declare class SubmitInstantJobDto extends SubmitJobReportDto {
    name: string;
    phone: string;
    serviceType: string;
    problemDescription: string;
    address: string;
    equipmentType?: string;
    equipmentBrand?: string;
    equipmentModel?: string;
    lat?: number;
    lng?: number;
    preferredTime?: string;
    source?: RequestSource;
}
export declare class JobReportsController {
    private svc;
    constructor(svc: JobReportsService);
    submit(srId: string, dto: SubmitJobReportDto, req: any): Promise<{
        report: import("./entities/job-report.entity").JobReport;
        invoice: import("../invoices/entities/invoice.entity").Invoice;
    }>;
    submitInstant(dto: SubmitInstantJobDto, req: any): Promise<{
        serviceRequest: import("../service-requests/entities/service-request.entity").ServiceRequest;
        report: import("./entities/job-report.entity").JobReport;
        invoice: import("../invoices/entities/invoice.entity").Invoice;
    }>;
    myJobs(req: any): Promise<import("./entities/job-report.entity").JobReport[]>;
    staffPerformance(): Promise<any[]>;
    findOne(id: string): Promise<import("./entities/job-report.entity").JobReport>;
}
export {};
