import { ServiceRequestsService } from './service-requests.service';
import { RequestStatus } from './entities/service-request.entity';
declare class CreateServiceRequestDto {
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
    source?: string;
    technicianId?: string;
}
declare class RecurringRequestDto {
    recurringDescription: string;
}
declare class AssignDto {
    technicianId: string;
}
declare class UpdateStatusDto {
    status: RequestStatus;
}
export declare class ServiceRequestsController {
    private svc;
    constructor(svc: ServiceRequestsService);
    create(dto: CreateServiceRequestDto): Promise<import("./entities/service-request.entity").ServiceRequest>;
    createRecurring(id: string, dto: RecurringRequestDto, req: any): Promise<import("./entities/service-request.entity").ServiceRequest>;
    findAll(status?: string, technicianId?: string, isRecurring?: string): Promise<import("./entities/service-request.entity").ServiceRequest[]>;
    myOrders(req: any): Promise<import("./entities/service-request.entity").ServiceRequest[]>;
    stats(): Promise<{
        total: number;
        thisMonth: number;
        recurring: number;
        pending: number;
    }>;
    findOne(id: string): Promise<import("./entities/service-request.entity").ServiceRequest>;
    assign(id: string, dto: AssignDto): Promise<import("./entities/service-request.entity").ServiceRequest>;
    updateStatus(id: string, dto: UpdateStatusDto): Promise<import("./entities/service-request.entity").ServiceRequest>;
}
export {};
