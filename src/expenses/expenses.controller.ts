import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, Request, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  IsNumber, IsOptional, IsString, IsNotEmpty, IsDateString, IsUUID, MaxLength, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

class CreateExpenseDto {
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) cost: number;
  @IsString() @IsNotEmpty() @MaxLength(150) shopName: string;
  @IsOptional() @IsString() @MaxLength(30) shopNumber?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  // Day of the spend, YYYY-MM-DD
  @IsDateString() spentAt: string;
  // Admin only: the technician the expense belongs to (defaults to the logged-in user)
  @IsOptional() @IsUUID() technicianId?: string;
}

class UpdateExpenseDto {
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) cost?: number;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(150) shopName?: string;
  @IsOptional() @IsString() @MaxLength(30) shopNumber?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsDateString() spentAt?: string;
  // Admin only: move the expense to another technician
  @IsOptional() @IsUUID() technicianId?: string;
}

class ExpenseQueryDto {
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsString() @MaxLength(150) shopName?: string;
  // Admin only: limit to one technician
  @IsOptional() @IsUUID() technicianId?: string;
}

interface AuthedRequest { user: { id: string; role: string } }

// Admins see and edit every expense; technicians only their own.
function ownerScope(req: AuthedRequest) {
  return req.user.role === 'admin' ? undefined : req.user.id;
}

// technicianId from the client only counts for admins; everyone else is pinned to themselves
function targetTechnician(req: AuthedRequest, technicianId?: string) {
  return req.user.role === 'admin' ? technicianId : req.user.id;
}

@ApiTags('expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'technician', 'senior_technician')
@ApiBearerAuth()
export class ExpensesController {
  constructor(private svc: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List expenses, newest first — own expenses for technicians, all for admin' })
  @ApiQuery({ name: 'from', required: false, description: 'Only spends on or after this date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'Only spends on or before this date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'shopName', required: false, description: 'Filter by shop name (partial match)' })
  @ApiQuery({ name: 'technicianId', required: false, description: 'Admin only: expenses of one technician' })
  findAll(@Request() req: AuthedRequest, @Query() q: ExpenseQueryDto) {
    return this.svc.findAll({ ...q, technicianId: targetTechnician(req, q.technicianId) });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Total spend, number of entries and average spend' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'technicianId', required: false, description: 'Admin only: totals for one technician' })
  summary(@Request() req: AuthedRequest, @Query() q: ExpenseQueryDto) {
    return this.svc.getSummary({ ...q, technicianId: targetTechnician(req, q.technicianId) });
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Spend per calendar month, newest month first' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'technicianId', required: false, description: 'Admin only: one technician' })
  monthly(@Request() req: AuthedRequest, @Query() q: ExpenseQueryDto) {
    return this.svc.getMonthly({ ...q, technicianId: targetTechnician(req, q.technicianId) });
  }

  @Get('by-shop')
  @ApiOperation({ summary: 'Spend per shop, biggest spend first' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'technicianId', required: false, description: 'Admin only: one technician' })
  byShop(@Request() req: AuthedRequest, @Query() q: ExpenseQueryDto) {
    return this.svc.getByShop({ ...q, technicianId: targetTechnician(req, q.technicianId) });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one expense' })
  findOne(@Request() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id, ownerScope(req));
  }

  @Post()
  @ApiOperation({ summary: 'Add an expense — against the logged-in user, or any technician for admin' })
  create(@Request() req: AuthedRequest, @Body() { technicianId, ...dto }: CreateExpenseDto) {
    return this.svc.create(dto, targetTechnician(req, technicianId) ?? req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense; all fields optional' })
  update(
    @Request() req: AuthedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { technicianId, ...dto }: UpdateExpenseDto,
  ) {
    const moveTo = req.user.role === 'admin' ? technicianId : undefined;
    return this.svc.update(id, dto, ownerScope(req), moveTo);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete an expense (admin only)' })
  remove(@Request() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id, ownerScope(req));
  }
}
