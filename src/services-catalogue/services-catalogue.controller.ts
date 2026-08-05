import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ServicesCatalogueService } from './services-catalogue.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('services-catalogue')
@Controller('services-catalogue')
export class ServicesCatalogueController {
  constructor(private svc: ServicesCatalogueService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active services (public — shown on homepage)' })
  findAll() { return this.svc.findAll(); }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findAllAdmin() { return this.svc.findAllAdmin(); }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() dto: any) { return this.svc.create(dto); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }
}
