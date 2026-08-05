import { Customer } from '../../customers/entities/customer.entity';
export declare class Notification {
    id: string;
    customer: Customer;
    serviceRequestId: string;
    type: string;
    channel: string;
    message: string;
    isSent: boolean;
    createdAt: Date;
    sentAt: Date;
}
