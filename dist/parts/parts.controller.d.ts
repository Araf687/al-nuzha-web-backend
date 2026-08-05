import { PartsService } from './parts.service';
declare class CreatePartDto {
    name: string;
    sku: string;
    unitPrice: number;
    stockQty: number;
    minStockLevel?: number;
}
declare class SetRemainingQtyDto {
    qty: number;
}
declare class BulkPartRowDto {
    name: string;
    sku: string;
    unitPrice: number;
    minStockLevel?: number;
}
declare class BulkCreatePartsDto {
    parts: BulkPartRowDto[];
}
declare class ChallanItemDto {
    partId: string;
    quantity: number;
    unitPrice: number;
}
declare class CreateChallanDto {
    challanNumber: string;
    purchaseDate: string;
    supplierName?: string;
    items: ChallanItemDto[];
}
declare class BulkChallanItemDto {
    partSku: string;
    quantity: number;
    unitPrice: number;
}
declare class BulkChallanRowDto {
    challanNumber: string;
    purchaseDate: string;
    supplierName?: string;
    items: BulkChallanItemDto[];
}
declare class BulkCreateChallansDto {
    challans: BulkChallanRowDto[];
}
export declare class PartsController {
    private svc;
    constructor(svc: PartsService);
    findAll(): Promise<import("./entities/part.entity").Part[]>;
    lowStock(): Promise<import("./entities/part.entity").Part[]>;
    pendingReview(): Promise<import("./entities/part.entity").Part[]>;
    listChallans(): Promise<import("./entities/challan.entity").PartChallan[]>;
    getOneChallan(id: string): Promise<import("./entities/challan.entity").PartChallan>;
    bulkCreate(dto: BulkCreatePartsDto): Promise<{
        created: import("./entities/part.entity").Part[];
        errors: {
            row: number;
            name: string;
            error: string;
        }[];
    }>;
    bulkCreateChallans(dto: BulkCreateChallansDto): Promise<{
        created: import("./entities/challan.entity").PartChallan[];
        errors: {
            challanNumber: string;
            error: string;
        }[];
    }>;
    createChallan(dto: CreateChallanDto): Promise<import("./entities/challan.entity").PartChallan>;
    findOne(id: string): Promise<import("./entities/part.entity").Part>;
    create(dto: CreatePartDto): Promise<import("./entities/part.entity").Part>;
    update(id: string, dto: Partial<CreatePartDto>): Promise<import("./entities/part.entity").Part>;
    approve(id: string, dto: Partial<CreatePartDto>): Promise<import("./entities/part.entity").Part>;
    setRemaining(id: string, dto: SetRemainingQtyDto): Promise<import("./entities/part.entity").Part>;
}
export {};
