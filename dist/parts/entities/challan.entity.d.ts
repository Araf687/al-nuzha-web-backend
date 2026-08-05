import { ChallanItem } from './challan-item.entity';
export declare class PartChallan {
    id: string;
    challanNumber: string;
    purchaseDate: string;
    supplierName: string;
    items: ChallanItem[];
    createdAt: Date;
}
