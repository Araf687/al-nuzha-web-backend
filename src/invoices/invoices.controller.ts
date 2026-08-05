import { Controller, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaymentStatus } from './entities/invoice.entity';

class MarkPaidDto {
  @IsString() paymentMethod: string;
}

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
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
  @ApiOperation({ summary: 'Mark invoice as paid' })
  markPaid(@Param('id') id: string, @Body() dto: MarkPaidDto) {
    return this.svc.markPaid(id, dto.paymentMethod);
  }
}
