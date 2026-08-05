import { Repository } from 'typeorm';
import { Part } from './entities/part.entity';
import { PartChallan } from './entities/challan.entity';
import { ChallanItem } from './entities/challan-item.entity';
export declare class PartsService {
    private repo;
    private challanRepo;
    private challanItemRepo;
    constructor(repo: Repository<Part>, challanRepo: Repository<PartChallan>, challanItemRepo: Repository<ChallanItem>);
    findAll(): Promise<Part[]>;
    findOne(id: string): Promise<Part>;
    create(dto: Partial<Part>): Promise<Part>;
    update(id: string, dto: Partial<Part>): Promise<Part>;
    getLowStock(): Promise<Part[]>;
    getPendingReview(): Promise<Part[]>;
    approveCustomPart(id: string, updates: Partial<Part>): Promise<Part>;
    bulkCreate(rows: Partial<Part>[]): Promise<{
        created: Part[];
        errors: {
            row: number;
            name: string;
            error: string;
        }[];
    }>;
    setRemainingQty(id: string, qty: number): Promise<Part>;
    createChallan(dto: {
        challanNumber: string;
        purchaseDate: string;
        supplierName?: string;
        items: {
            partId: string;
            quantity: number;
            unitPrice: number;
        }[];
    }): Promise<PartChallan>;
    bulkCreateChallans(challans: {
        challanNumber: string;
        purchaseDate: string;
        supplierName?: string;
        items: {
            partSku: string;
            quantity: number;
            unitPrice: number;
        }[];
    }[]): Promise<{
        created: PartChallan[];
        errors: {
            challanNumber: string;
            error: string;
        }[];
    }>;
    findAllChallans(): Promise<PartChallan[]>;
    findOneChallan(id: string): Promise<PartChallan>;
}
