import { Repository } from 'typeorm';
import { Technician } from './entities/technician.entity';
export declare class TechniciansService {
    private repo;
    constructor(repo: Repository<Technician>);
    findAll(): Promise<Technician[]>;
    findOne(id: string): Promise<Technician>;
    create(dto: {
        name: string;
        phone: string;
        email?: string;
        password: string;
        role?: string;
    }): Promise<{
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
    update(id: string, dto: {
        name?: string;
        email?: string;
        role?: string;
        isActive?: boolean;
    }): Promise<{
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
    resetPassword(id: string, newPassword: string): Promise<{
        message: string;
    }>;
    savePushToken(id: string, expoPushToken: string): Promise<{
        message: string;
    }>;
}
