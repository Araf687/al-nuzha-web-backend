import { Controller, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

class ResetPasswordDto {
  @IsString() @MinLength(6) newPassword: string;
}

class CustomerQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsIn(['with', 'cleared']) due?: 'with' | 'cleared';
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private svc: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Customers with job counts and open balances, one page at a time' })
  @ApiQuery({ name: 'search', required: false, description: 'Name, phone, email or address' })
  @ApiQuery({ name: 'due', required: false, description: "'with' = owes money, 'cleared' = owes nothing" })
  @ApiQuery({ name: 'page', required: false, description: 'Defaults to 1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Defaults to 25, capped at 100' })
  findAll(@Query() q: CustomerQueryDto) {
    return this.svc.findAll({
      search: q.search,
      due: q.due,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  }

  @Get('me')
  me(@Request() req) { return this.svc.findOne(req.user.id); }

  // Staff only — a customer reads their own record through /customers/me
  @Get(':id')
  @Roles('admin', 'technician', 'senior_technician')
  @ApiOperation({ summary: 'One customer with their job history, totals and dues' })
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Patch('me')
  update(@Request() req, @Body() dto: any) { return this.svc.update(req.user.id, dto); }

  @Patch(':id/reset-password')
  @Roles('admin')
  @ApiOperation({ summary: 'Reset a customer password (admin only)' })
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.svc.resetPassword(id, dto.newPassword);
  }
}
