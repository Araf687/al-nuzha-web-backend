import { ServiceRequest } from '../../service-requests/entities/service-request.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Notification } from '../../notifications/entities/notification.entity';
export declare class Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    lat: number;
    lng: number;
    passwordHash: string;
    isRegistered: boolean;
    createdAt: Date;
    serviceRequests: ServiceRequest[];
    invoices: Invoice[];
    reviews: Review[];
    notifications: Notification[];
}
