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

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private svc: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all invoices (admin)' })
  @ApiQuery({ name: 'status', enum: PaymentStatus, required: false })
  findAll(@Query('status') status?: PaymentStatus) { return this.svc.findAll(status); }

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
