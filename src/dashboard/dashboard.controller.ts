import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private svc: DashboardService) {}

  @Get()
  @ApiOperation({
    summary:
      'Admin dashboard — job/revenue/purchase stats, revenue & parts by month, challans, top technicians and recent jobs for a date range',
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD (defaults to start of current month)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD (defaults to today)' })
  getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.svc.getSummary(startDate, endDate);
  }
}
