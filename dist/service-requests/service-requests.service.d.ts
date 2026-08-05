import { Repository } from 'typeorm';
import { ServiceRequest, RequestStatus } from './entities/service-request.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Technician } from '../technicians/entities/technician.entity';
import { PushNotificationService } from '../common/push-notification.service';
export declare class ServiceRequestsService {
    private repo;
    private customersRepo;
    private techRepo;
    private pushService;
    constructor(repo: Repository<ServiceRequest>, customersRepo: Repository<Customer>, techRepo: Repository<Technician>, pushService: PushNotificationService);
    private generateJobRef;
    private notifyTechnician;
    create(dto: any): Promise<ServiceRequest>;
    createRecurring(parentJobId: string, recurringDescription: string, customerId: string): Promise<ServiceRequest>;
    findAll(filters: {
        status?: string;
        technicianId?: string;
        isRecurring?: boolean;
    }): Promise<ServiceRequest[]>;
    findByCustomer(customerId: string): Promise<ServiceRequest[]>;
    findOne(id: string): Promise<ServiceRequest>;
    private findOneForUpdate;
    assign(id: string, technicianId: string): Promise<ServiceRequest>;
    updateStatus(id: string, status: RequestStatus): Promise<ServiceRequest>;
    getMonthlyStats(): Promise<{
        total: number;
        thisMonth: number;
        recurring: number;
        pending: number;
    }>;
}
