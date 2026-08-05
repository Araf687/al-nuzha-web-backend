import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private svc: ReviewsService) {}
  @Get() @ApiOperation({ summary: 'Get approved reviews (public — shown on homepage)' }) findApproved() { return this.svc.findApproved(); }
  @Get('admin') @UseGuards(JwtAuthGuard) @ApiBearerAuth() findAll() { return this.svc.findAll(); }
  @Post() @UseGuards(JwtAuthGuard) @ApiBearerAuth() create(@Body() dto: any, @Request() req) { return this.svc.create(dto, req.user.id); }
  @Patch(':id/approve') @UseGuards(JwtAuthGuard) @ApiBearerAuth() approve(@Param('id') id: string) { return this.svc.approve(id); }
}
