import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class RegisterDto {
  @IsString() name: string;
  @IsString() phone: string;
  @IsOptional() @IsString() email?: string;
  @IsString() @MinLength(6) password: string;
}

class LoginDto {
  @IsString() phone: string;
  @IsString() password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('customer/register')
  @ApiOperation({ summary: 'Register a new customer account' })
  register(@Body() dto: RegisterDto) {
    return this.auth.registerCustomer(dto);
  }

  @Post('customer/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Customer login — returns JWT' })
  loginCustomer(@Body() dto: LoginDto) {
    return this.auth.loginCustomer(dto.phone, dto.password);
  }

  @Post('technician/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Technician login — returns JWT' })
  loginTechnician(@Body() dto: LoginDto) {
    return this.auth.loginTechnician(dto.phone, dto.password);
  }
}
