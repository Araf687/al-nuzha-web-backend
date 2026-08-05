import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private svc;
    constructor(svc: NotificationsService);
    findAll(): Promise<import("./entities/notification.entity").Notification[]>;
}
