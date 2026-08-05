import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
export declare class NotificationsService {
    private repo;
    constructor(repo: Repository<Notification>);
    send(data: {
        customerId?: string;
        serviceRequestId?: string;
        type: string;
        channel?: string;
        message: string;
    }): Promise<Notification>;
    findAll(): Promise<Notification[]>;
}
