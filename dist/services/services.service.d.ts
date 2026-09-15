import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
type ServiceInput = Partial<Pick<Service, 'title' | 'startingPrice' | 'isCustomQuote' | 'priority' | 'thumbnail'>>;
export declare class ServicesService {
    private repo;
    constructor(repo: Repository<Service>);
    findAll(): Promise<Service[]>;
    findOne(id: string): Promise<Service>;
    create(dto: ServiceInput): Promise<Service>;
    update(id: string, dto: ServiceInput): Promise<Service>;
    remove(id: string): Promise<{
        message: string;
    }>;
    private applyPriceRule;
    removeFile(publicPath?: string): Promise<void>;
}
export {};
