import { AuthService } from './auth.service';
declare class RegisterDto {
    name: string;
    phone: string;
    email?: string;
    password: string;
}
declare class LoginDto {
    phone: string;
    password: string;
}
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            phone: string;
            role: string;
        };
    }>;
    loginCustomer(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            phone: string;
            role: string;
        };
    }>;
    loginTechnician(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            phone: string;
            role: string;
        };
    }>;
}
export {};
