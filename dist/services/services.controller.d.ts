import { ServicesService } from './services.service';
declare class CreateServiceDto {
    title: string;
    isCustomQuote?: boolean;
    startingPrice?: number;
    priority?: number;
}
declare class UpdateServiceDto {
    title?: string;
    isCustomQuote?: boolean;
    startingPrice?: number;
    priority?: number;
}
interface UploadedImage {
    filename: string;
}
export declare class ServicesController {
    private svc;
    constructor(svc: ServicesService);
    findAll(): Promise<import("./entities/service.entity").Service[]>;
    findOne(id: string): Promise<import("./entities/service.entity").Service>;
    create(dto: CreateServiceDto, file: UploadedImage): Promise<import("./entities/service.entity").Service>;
    update(id: string, dto: UpdateServiceDto, file?: UploadedImage): Promise<import("./entities/service.entity").Service>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
export {};
