import { Customer } from '../../customers/entities/customer.entity';
import { Technician } from '../../technicians/entities/technician.entity';
import { JobReport } from '../../job-reports/entities/job-report.entity';
export declare enum RequestSource {
    PHONE = "phone",
    WEBSITE = "website",
    ADMIN = "admin"
}
export declare enum RequestStatus {
    PENDING = "pending",
    ASSIGNED = "assigned",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class ServiceRequest {
    id: string;
    jobRef: string;
    source: RequestSource;
    serviceType: string;
    equipmentType: string;
    equipmentBrand: string;
    equipmentModel: string;
    problemDescription: string;
    address: string;
    lat: number;
    lng: number;
    preferredTime: string;
    status: RequestStatus;
    isRecurring: boolean;
    parentJobId: string;
    customer: Customer;
    assignedTechnician: Technician;
    jobReport: JobReport;
    createdAt: Date;
    scheduledAt: Date;
}
