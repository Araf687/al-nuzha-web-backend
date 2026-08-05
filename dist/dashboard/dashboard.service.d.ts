import { Repository } from 'typeorm';
import { ServiceRequest, RequestStatus } from '../service-requests/entities/service-request.entity';
import { Invoice, PaymentStatus } from '../invoices/entities/invoice.entity';
import { JobReport } from '../job-reports/entities/job-report.entity';
import { PartChallan } from '../parts/entities/challan.entity';
import { Part } from '../parts/entities/part.entity';
export declare class DashboardService {
    private requestsRepo;
    private invoicesRepo;
    private reportsRepo;
    private challansRepo;
    private partsRepo;
    constructor(requestsRepo: Repository<ServiceRequest>, invoicesRepo: Repository<Invoice>, reportsRepo: Repository<JobReport>, challansRepo: Repository<PartChallan>, partsRepo: Repository<Part>);
    private resolveRange;
    getSummary(startDate?: string, endDate?: string): Promise<{
        range: {
            startDate: string;
            endDate: string;
        };
        stats: {
            jobs: {
                total: number;
                completed: number;
                pending: number;
                assigned: number;
                inProgress: number;
                cancelled: number;
                recurring: number;
            };
            revenue: {
                billed: number;
                collected: number;
                outstanding: number;
                advanceCollected: number;
                invoiceCount: number;
            };
            purchases: {
                spend: number;
                challanCount: number;
                partsAddedQty: number;
            };
            inventory: {
                lowStockCount: number;
                pendingReviewCount: number;
            };
        };
        revenueByMonth: {
            month: string;
            totalRevenue: number;
            collectedRevenue: number;
            invoiceCount: number;
        }[];
        partsAddedByMonth: {
            month: string;
            qty: number;
            spend: number;
            challans: number;
        }[];
        challans: {
            id: string;
            challanNumber: string;
            purchaseDate: string;
            supplierName: string;
            itemCount: number;
            quantity: number;
            total: number;
        }[];
        topTechnicians: {
            technicianId: string;
            name: string;
            jobsCompleted: number;
            totalRevenue: number;
            avgDurationHours: number;
        }[];
        recentJobs: {
            id: string;
            jobRef: string;
            serviceType: string;
            address: string;
            status: RequestStatus;
            isRecurring: boolean;
            createdAt: Date;
            customer: {
                id: string;
                name: string;
                phone: string;
            };
            technician: {
                id: string;
                name: string;
            };
            invoice: {
                id: string;
                invoiceRef: string;
                total: number;
                paymentStatus: PaymentStatus;
                paymentMethod: string;
                advanceAmount: number;
                issuedAt: Date;
            };
        }[];
    }>;
}
