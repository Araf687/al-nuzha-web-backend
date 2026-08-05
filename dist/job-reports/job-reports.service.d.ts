import { Repository } from 'typeorm';
import { JobReport } from './entities/job-report.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { Part } from '../parts/entities/part.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Customer } from '../customers/entities/customer.entity';
export declare class JobReportsService {
    private reportsRepo;
    private srRepo;
    private partsRepo;
    private invoicesRepo;
    private customersRepo;
    constructor(reportsRepo: Repository<JobReport>, srRepo: Repository<ServiceRequest>, partsRepo: Repository<Part>, invoicesRepo: Repository<Invoice>, customersRepo: Repository<Customer>);
    submit(serviceRequestId: string, technicianId: string, dto: any): Promise<{
        report: JobReport;
        invoice: Invoice;
    }>;
    submitInstantJob(technicianId: string, dto: any): Promise<{
        serviceRequest: ServiceRequest;
        report: JobReport;
        invoice: Invoice;
    }>;
    private generateJobRef;
    private createCompletedJob;
    findOne(id: string): Promise<JobReport>;
    findByTechnician(techId: string): Promise<JobReport[]>;
    getStaffPerformance(): Promise<any[]>;
}
