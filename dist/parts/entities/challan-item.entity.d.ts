import { PartChallan } from './challan.entity';
import { Part } from './part.entity';
export declare class ChallanItem {
    id: string;
    challan: PartChallan;
    part: Part;
    quantity: number;
    unitPrice: number;
}
