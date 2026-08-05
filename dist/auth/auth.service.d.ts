import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { Technician } from '../technicians/entities/technician.entity';
export declare class AuthService {
    private customersRepo;
    private techniciansRepo;
    private jwtService;
    constructor(customersRepo: Repository<Customer>, techniciansRepo: Repository<Technician>, jwtService: JwtService);
    registerCustomer(data: {
        name: string;
        phone: string;
        email?: string;
        password: string;
    }): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            phone: string;
            role: string;
        };
    }>;
    loginCustomer(phone: string, password: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            phone: string;
            role: string;
        };
    }>;
    loginTechnician(phone: string, password: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            phone: string;
            role: string;
        };
    }>;
    private signCustomer;
    private signTechnician;
}
