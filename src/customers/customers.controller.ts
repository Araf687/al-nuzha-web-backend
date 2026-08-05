import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

class ResetPasswordDto {
  @IsString() @MinLength(6) newPassword: string;
}

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private svc: CustomersService) {}

  @Get()
  findAll() { return this.svc.findAll(); }

  @Get('me')
  me(@Request() req) { return this.svc.findOne(req.user.id); }

  @Get(':id')
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
