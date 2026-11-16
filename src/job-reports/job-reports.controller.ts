import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  IsString, IsNumber, IsOptional, IsArray, IsIn, IsEnum,
  ArrayMinSize, ArrayMaxSize, ValidateNested, IsNotEmpty, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JobReportsService } from './job-reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestSource } from '../service-requests/entities/service-request.entity';

class JobPartDto {
  @IsOptional() @IsString() partId?: string;
  @IsOptional() @IsString() customPartName?: string;
  @IsNumber() quantity: number;
  @IsNumber() unitPrice: number;
}

class JobServiceDto {
  @IsString() serviceName: string;
  @IsOptional() @IsNumber() quantity?: number;
  @IsOptional() @IsNumber() unitPrice?: number;
  @IsNumber() labourCost: number;
  @IsOptional() @IsString() notes?: string;
}

class JobExpenseDto {
  @IsString() description: string;
  @IsNumber() amount: number;
}

class SubmitJobReportDto {
  @IsOptional() @IsString() faultFound?: string;
  @IsOptional() @IsString() diagnosisNotes?: string;
  @IsNumber() labourCharge: number;
  @IsIn(['card', 'cash', 'due']) paymentType: string;
  @IsOptional() @IsNumber() advanceAmount?: number;
  @IsOptional() @IsString() customerSignatureUrl?: string;
  @IsOptional() @IsString() arrivedAt?: string;
  @IsArray() parts: JobPartDto[];
  @IsArray() services: JobServiceDto[];
  @IsArray() expenses: JobExpenseDto[];
}

class ImportServiceLineDto {
  @IsString() @IsNotEmpty() serviceName: string;
  @IsNumber() @Min(0) quantity: number;
  @IsNumber() @Min(0) unitPrice: number;
}

// One past job from the spreadsheet: its rows already grouped by Job No
class ImportJobDto {
  @IsString() @IsNotEmpty() jobNo: string;            // the sheet's grouping key, echoed back in results
  @IsOptional() @IsString() date?: string;            // ISO; defaults to now
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() technicianPhone?: string;
  @IsIn(['card', 'cash', 'due']) paymentType: string;
  @IsOptional() @IsNumber() @Min(0) advance?: number;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ImportServiceLineDto)
  services: ImportServiceLineDto[];
}

class BulkImportJobsDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) @ValidateNested({ each: true }) @Type(() => ImportJobDto)
  jobs: ImportJobDto[];
}

class SubmitInstantJobDto extends SubmitJobReportDto {
  @IsString() name: string;
  @IsString() phone: string;
  @IsString() serviceType: string;
  @IsString() problemDescription: string;
  @IsString() address: string;
  @IsOptional() @IsString() equipmentType?: string;
  @IsOptional() @IsString() equipmentBrand?: string;
  @IsOptional() @IsString() equipmentModel?: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
  @IsOptional() @IsString() preferredTime?: string;
  @IsOptional() @IsEnum(RequestSource) source?: RequestSource;
}

@ApiTags('job-reports')
@Controller('job-reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobReportsController {
  constructor(private svc: JobReportsService) {}

  @Post('service-request/:srId')
  @ApiOperation({ summary: 'Technician submits a completed job report from the field' })
  submit(
    @Param('srId') srId: string,
    @Body() dto: SubmitJobReportDto,
    @Request() req,
  ) {
    return this.svc.submit(srId, req.user.id, dto);
  }

  @Post('bulk-import')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Import past (completed) jobs with their bills from a spreadsheet (admin)' })
  bulkImport(@Body() dto: BulkImportJobsDto) {
    return this.svc.bulkImport(dto.jobs);
  }

  @Post('instant')
  @ApiOperation({ summary: 'Technician creates an instant job and submits the completed report in one step' })
  submitInstant(
    @Body() dto: SubmitInstantJobDto,
    @Request() req,
  ) {
    return this.svc.submitInstantJob(req.user.id, dto);
  }

  @Get('my-jobs')
  @ApiOperation({ summary: 'Technician — get their own completed job reports' })
  myJobs(@Request() req) {
    return this.svc.findByTechnician(req.user.id);
  }

  @Get('staff-performance')
  @ApiOperation({ summary: 'Admin — staff performance stats' })
  staffPerformance() {
    return this.svc.getStaffPerformance();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single job report by ID' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }
}
