import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { JobReport } from '../job-reports/entities/job-report.entity';
import { PartChallan } from '../parts/entities/challan.entity';
import { Part } from '../parts/entities/part.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { FuelLog } from '../fuel-logs/entities/fuel-log.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceRequest, Invoice, JobReport, PartChallan, Part, Expense, FuelLog]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
