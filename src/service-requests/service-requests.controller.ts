import {
  Controller, Get, Post, Patch, Body, Param,
  Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsEnum, IsNumber, MinLength,
} from 'class-validator';
import { ServiceRequestsService } from './service-requests.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestStatus, RequestSource } from './entities/service-request.entity';

class CreateServiceRequestDto {
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
  @IsOptional() @IsString() technicianId?: string;
}

class RecurringRequestDto {
  @IsString() @MinLength(20) recurringDescription: string;
}

class AssignDto {
  @IsString() technicianId: string;
}

class UpdateStatusDto {
  @IsEnum(RequestStatus) status: RequestStatus;
}

@ApiTags('service-requests')
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private svc: ServiceRequestsService) {}

  // Public — anyone can submit a request
  @Post()
  @ApiOperation({ summary: 'Submit a new service request (guest or registered)' })
  create(@Body() dto: CreateServiceRequestDto) {
    return this.svc.create(dto);
  }

  // Registered customer — recurring request from history
  @Post(':id/recurring')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report a recurring issue from a previous job' })
  createRecurring(
    @Param('id') id: string,
    @Body() dto: RecurringRequestDto,
    @Request() req,
  ) {
    return this.svc.createRecurring(id, dto.recurringDescription, req.user.id);
  }

  // Admin — get all jobs
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all service requests (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'technicianId', required: false })
  @ApiQuery({ name: 'isRecurring', required: false })
  findAll(
    @Query('status') status?: string,
    @Query('technicianId') technicianId?: string,
    @Query('isRecurring') isRecurring?: string,
  ) {
    return this.svc.findAll({
      status,
      technicianId,
      isRecurring: isRecurring !== undefined ? isRecurring === 'true' : undefined,
    });
  }

  // Customer — my orders
  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get logged-in customer\'s service history' })
  myOrders(@Request() req) {
    return this.svc.findByCustomer(req.user.id);
  }

  // Stats
  @Get('stats/monthly')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Monthly stats for admin dashboard' })
  stats() {
    return this.svc.getMonthlyStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign a technician to a job (dispatcher)' })
  assign(@Param('id') id: string, @Body() dto: AssignDto) {
    return this.svc.assign(id, dto.technicianId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update job status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.svc.updateStatus(id, dto.status);
  }
}
