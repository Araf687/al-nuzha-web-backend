import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { TechniciansService } from './technicians.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

enum TechnicianRole {
  TECHNICIAN = 'technician',
  SENIOR_TECHNICIAN = 'senior_technician',
  ADMIN = 'admin',
}

class CreateTechnicianDto {
  @IsString() name: string;
  @IsString() phone: string;
  @IsOptional() @IsString() email?: string;
  @IsString() @MinLength(6) password: string;
  @IsOptional() @IsEnum(TechnicianRole) role?: TechnicianRole;
}

class UpdateTechnicianDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsEnum(TechnicianRole) role?: TechnicianRole;
  @IsOptional() isActive?: boolean;
}

class ResetPasswordDto {
  @IsString() @MinLength(6) newPassword: string;
}

class PushTokenDto {
  @IsString() expoPushToken: string;
}

@ApiTags('technicians')
@Controller('technicians')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TechniciansController {
  constructor(private svc: TechniciansService) {}

  @Get()
  @ApiOperation({ summary: 'List all active technicians (admin)' })
  findAll() { return this.svc.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single technician by ID (admin)' })
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a technician or admin account (admin only)' })
  create(@Body() dto: CreateTechnicianDto) { return this.svc.create(dto); }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a technician account (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateTechnicianDto) {
    return this.svc.update(id, dto);
  }

  @Patch(':id/reset-password')
  @Roles('admin')
  @ApiOperation({ summary: 'Reset a technician password (admin only)' })
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.svc.resetPassword(id, dto.newPassword);
  }

  @Patch('me/push-token')
  @ApiOperation({ summary: 'Save Expo push token for the logged-in technician' })
  savePushToken(@Request() req, @Body() dto: PushTokenDto) {
    return this.svc.savePushToken(req.user.id, dto.expoPushToken);
  }
}
