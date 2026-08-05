import { JobReport } from './job-report.entity';
import { Part } from '../../parts/entities/part.entity';
export declare class JobPart {
    id: string;
    jobReport: JobReport;
    part: Part;
    customPartName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    isCustom: boolean;
}
