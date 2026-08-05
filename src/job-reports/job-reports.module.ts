import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobReport } from './entities/job-report.entity';
import { JobPart } from './entities/job-part.entity';
import { JobService } from './entities/job-service.entity';
import { JobExpense } from './entities/job-expense.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { Part } from '../parts/entities/part.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Customer } from '../customers/entities/customer.entity';
import { JobReportsService } from './job-reports.service';
import { JobReportsController } from './job-reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([JobReport, JobPart, JobService, JobExpense, ServiceRequest, Part, Invoice, Customer])],
  controllers: [JobReportsController],
  providers: [JobReportsService],
})
export class JobReportsModule {}
