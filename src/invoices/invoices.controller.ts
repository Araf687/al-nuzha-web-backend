import { Controller, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaymentStatus } from './entities/invoice.entity';

class MarkPaidDto {
  @IsString() paymentMethod: string;
}

export class UpdatePaymentDto {
  @IsEnum(PaymentStatus) paymentStatus: PaymentStatus;
  // Total amount received so far — required when paymentStatus is 'partial'
  @IsOptional() @IsNumber() @Min(0) amountPaid?: number;
  @IsOptional() @IsString() paymentMethod?: string;
}

class InvoiceQueryDto {
  @IsOptional() @IsEnum(PaymentStatus) status?: PaymentStatus;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private svc: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'Invoices with totals, one page at a time (admin)' })
  @ApiQuery({ name: 'status', enum: PaymentStatus, required: false })
  @ApiQuery({ name: 'search', required: false, description: 'Invoice ref, customer name or phone' })
  @ApiQuery({ name: 'page', required: false, description: 'Defaults to 1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Defaults to 25, capped at 100' })
  findAll(@Query() q: InvoiceQueryDto) {
    return this.svc.findAll({
      status: q.status,
      search: q.search,
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  }

  @Get('my-invoices')
  @ApiOperation({ summary: 'Get logged-in customer\'s invoices' })
  myInvoices(@Request() req) { return this.svc.findByCustomer(req.user.id); }

  @Get('revenue-summary')
  @ApiOperation({ summary: 'Monthly revenue summary (admin dashboard)' })
  revenue() { return this.svc.getRevenueSummary(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Patch(':id/mark-paid')
  @Roles('admin')
  @ApiOperation({ summary: 'Mark invoice as paid (admin only)' })
  markPaid(@Param('id') id: string, @Body() dto: MarkPaidDto) {
    return this.svc.markPaid(id, dto.paymentMethod);
  }

  @Patch(':id/payment')
  @Roles('admin')
  @ApiOperation({ summary: 'Update invoice payment status — paid, partial (with amount) or unpaid (admin only)' })
  updatePayment(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.svc.updatePayment(id, dto);
  }
}
