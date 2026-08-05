import { Repository } from 'typeorm';
import { ServiceCatalogue } from './entities/service-catalogue.entity';
export declare class ServicesCatalogueService {
    private repo;
    constructor(repo: Repository<ServiceCatalogue>);
    findAll(): Promise<ServiceCatalogue[]>;
    findAllAdmin(): Promise<ServiceCatalogue[]>;
    create(dto: Partial<ServiceCatalogue>): Promise<ServiceCatalogue>;
    update(id: string, dto: Partial<ServiceCatalogue>): Promise<ServiceCatalogue & Partial<ServiceCatalogue>>;
}
