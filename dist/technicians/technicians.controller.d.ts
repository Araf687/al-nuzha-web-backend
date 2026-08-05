import { TechniciansService } from './technicians.service';
declare enum TechnicianRole {
    TECHNICIAN = "technician",
    SENIOR_TECHNICIAN = "senior_technician",
    ADMIN = "admin"
}
declare class CreateTechnicianDto {
    name: string;
    phone: string;
    email?: string;
    password: string;
    role?: TechnicianRole;
}
declare class UpdateTechnicianDto {
    name?: string;
    email?: string;
    role?: TechnicianRole;
    isActive?: boolean;
}
declare class ResetPasswordDto {
    newPassword: string;
}
declare class PushTokenDto {
    expoPushToken: string;
}
export declare class TechniciansController {
    private svc;
    constructor(svc: TechniciansService);
    findAll(): Promise<import("./entities/technician.entity").Technician[]>;
    findOne(id: string): Promise<import("./entities/technician.entity").Technician>;
    create(dto: CreateTechnicianDto): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string;
        role: string;
        isActive: boolean;
        expoPushToken: string;
        createdAt: Date;
        assignedRequests: import("../service-requests/entities/service-request.entity").ServiceRequest[];
        jobReports: import("../job-reports/entities/job-report.entity").JobReport[];
    }>;
    update(id: string, dto: UpdateTechnicianDto): Promise<{
        id: string;
        name: string;
        phone: string;
        email: string;
        role: string;
        isActive: boolean;
        expoPushToken: string;
        createdAt: Date;
        assignedRequests: import("../service-requests/entities/service-request.entity").ServiceRequest[];
        jobReports: import("../job-reports/entities/job-report.entity").JobReport[];
    }>;
    resetPassword(id: string, dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    savePushToken(req: any, dto: PushTokenDto): Promise<{
        message: string;
    }>;
}
export {};
