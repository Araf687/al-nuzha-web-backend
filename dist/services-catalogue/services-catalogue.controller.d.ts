import { ServicesCatalogueService } from './services-catalogue.service';
export declare class ServicesCatalogueController {
    private svc;
    constructor(svc: ServicesCatalogueService);
    findAll(): Promise<import("./entities/service-catalogue.entity").ServiceCatalogue[]>;
    findAllAdmin(): Promise<import("./entities/service-catalogue.entity").ServiceCatalogue[]>;
    create(dto: any): Promise<import("./entities/service-catalogue.entity").ServiceCatalogue>;
    update(id: string, dto: any): Promise<import("./entities/service-catalogue.entity").ServiceCatalogue & Partial<import("./entities/service-catalogue.entity").ServiceCatalogue>>;
}
