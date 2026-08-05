import { ServiceRequest } from '../../service-requests/entities/service-request.entity';
import { JobReport } from '../../job-reports/entities/job-report.entity';
export declare class Technician {
    id: string;
    name: string;
    phone: string;
    email: string;
    passwordHash: string;
    role: string;
    isActive: boolean;
    expoPushToken: string;
    createdAt: Date;
    assignedRequests: ServiceRequest[];
    jobReports: JobReport[];
}
