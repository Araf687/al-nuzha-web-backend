import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private svc;
    constructor(svc: DashboardService);
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
            status: import("../service-requests/entities/service-request.entity").RequestStatus;
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
                paymentStatus: import("../invoices/entities/invoice.entity").PaymentStatus;
                paymentMethod: string;
                advanceAmount: number;
                issuedAt: Date;
            };
        }[];
    }>;
}
