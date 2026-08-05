import { CustomersService } from './customers.service';
declare class ResetPasswordDto {
    newPassword: string;
}
export declare class CustomersController {
    private svc;
    constructor(svc: CustomersService);
    findAll(): Promise<import("./entities/customer.entity").Customer[]>;
    me(req: any): Promise<import("./entities/customer.entity").Customer>;
    findOne(id: string): Promise<import("./entities/customer.entity").Customer>;
    update(req: any, dto: any): Promise<import("./entities/customer.entity").Customer>;
    resetPassword(id: string, dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
export {};
