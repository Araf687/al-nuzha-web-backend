import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, Request, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsDateString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FuelLogsService } from './fuel-logs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

class CreateFuelLogDto {
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) litres: number;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) cost: number;
  // Day of the refill, YYYY-MM-DD
  @IsDateString() filledAt: string;
  // Admin only: the technician the refill belongs to (defaults to the logged-in user)
  @IsOptional() @IsUUID() technicianId?: string;
}

class UpdateFuelLogDto {
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) litres?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) cost?: number;
  @IsOptional() @IsDateString() filledAt?: string;
  // Admin only: move the refill to another technician
  @IsOptional() @IsUUID() technicianId?: string;
}

class RangeQueryDto {
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  // Admin only: limit to one technician
  @IsOptional() @IsUUID() technicianId?: string;
}

interface AuthedRequest { user: { id: string; role: string } }

// Admins see and edit every refill; technicians only their own.
function ownerScope(req: AuthedRequest) {
  return req.user.role === 'admin' ? undefined : req.user.id;
}

// technicianId from the client only counts for admins; everyone else is pinned to themselves
function targetTechnician(req: AuthedRequest, technicianId?: string) {
  return req.user.role === 'admin' ? technicianId : req.user.id;
}

@ApiTags('fuel-logs')
@Controller('fuel-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'technician', 'senior_technician')
@ApiBearerAuth()
export class FuelLogsController {
  constructor(private svc: FuelLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List fuel refills, newest first — own refills for technicians, all for admin' })
  @ApiQuery({ name: 'from', required: false, description: 'Only refills on or after this date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'Only refills on or before this date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'technicianId', required: false, description: 'Admin only: refills of one technician' })
  findAll(@Request() req: AuthedRequest, @Query() q: RangeQueryDto) {
    return this.svc.findAll({ ...q, technicianId: targetTechnician(req, q.technicianId) });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Total litres, total cost and average cost per litre' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'technicianId', required: false, description: 'Admin only: totals for one technician' })
  summary(@Request() req: AuthedRequest, @Query() q: RangeQueryDto) {
    return this.svc.getSummary({ ...q, technicianId: targetTechnician(req, q.technicianId) });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one fuel refill' })
  findOne(@Request() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id, ownerScope(req));
  }

  @Post()
  @ApiOperation({ summary: 'Add a fuel refill — against the logged-in user, or any technician for admin' })
  create(@Request() req: AuthedRequest, @Body() { technicianId, ...dto }: CreateFuelLogDto) {
    return this.svc.create(dto, targetTechnician(req, technicianId) ?? req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a fuel refill; all fields optional' })
  update(
    @Request() req: AuthedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { technicianId, ...dto }: UpdateFuelLogDto,
  ) {
    const moveTo = req.user.role === 'admin' ? technicianId : undefined;
    return this.svc.update(id, dto, ownerScope(req), moveTo);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a fuel refill (admin only)' })
  remove(@Request() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id, ownerScope(req));
  }
}
