import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, Request, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsEnum, IsNumber, MinLength,
  IsArray, ArrayMinSize, IsNotEmpty,
} from 'class-validator';
import { ServiceRequestsService } from './service-requests.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestStatus, RequestSource } from './entities/service-request.entity';

class CreateServiceRequestDto {
  @IsString() name: string;
  @IsString() phone: string;
  // Either serviceType or serviceItems is required; service derives serviceType from the items
  @IsOptional() @IsString() serviceType?: string;
  @IsOptional() @IsArray() @ArrayMinSize(1) @IsString({ each: true }) @IsNotEmpty({ each: true })
  serviceItems?: string[];
  @IsOptional() @IsString() problemDescription?: string;
  @IsOptional() @IsString() address?: string;
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

class UpdateServiceRequestDto {
  @IsOptional() @IsString() serviceType?: string;
  @IsOptional() @IsArray() @ArrayMinSize(1) @IsString({ each: true }) @IsNotEmpty({ each: true })
  serviceItems?: string[];
  @IsOptional() @IsString() problemDescription?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() equipmentType?: string;
  @IsOptional() @IsString() equipmentBrand?: string;
  @IsOptional() @IsString() equipmentModel?: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
  @IsOptional() @IsString() preferredTime?: string;
  @IsOptional() @IsEnum(RequestStatus) status?: RequestStatus;
  // Empty string clears the assignment; a uuid moves the job to that technician
  @IsOptional() @IsString() technicianId?: string;
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
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'One or more of pending, assigned, in_progress, completed, cancelled, due — comma separated. ' +
      '`due` means the job\'s invoice still has an unpaid balance.',
  })
  @ApiQuery({ name: 'technicianId', required: false })
  @ApiQuery({ name: 'isRecurring', required: false })
  @ApiQuery({ name: 'search', required: false, description: 'Job id or ref, customer name, phone, area or service type' })
  @ApiQuery({ name: 'page', required: false, description: 'Defaults to 1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Defaults to 25, capped at 100' })
  findAll(
    @Query('status') status?: string,
    @Query('technicianId') technicianId?: string,
    @Query('isRecurring') isRecurring?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.findAll({
      status,
      technicianId,
      isRecurring: isRecurring !== undefined ? isRecurring === 'true' : undefined,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit a job (admin); every field optional' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceRequestDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a job (admin); refused once it has a job report' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id);
  }
}
