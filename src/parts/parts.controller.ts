import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { PartsService } from './parts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

class CreatePartDto {
  @IsString() name: string;
  @IsString() sku: string;
  @IsNumber() unitPrice: number;
  @IsNumber() stockQty: number;
  @IsOptional() @IsNumber() minStockLevel?: number;
}

class SetRemainingQtyDto {
  @IsNumber() qty: number;
}

class BulkPartRowDto {
  @IsString() name: string;
  @IsString() sku: string;
  @IsNumber() unitPrice: number;
  @IsOptional() @IsNumber() minStockLevel?: number;
}

class BulkCreatePartsDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => BulkPartRowDto)
  parts: BulkPartRowDto[];
}

class ChallanItemDto {
  @IsString() partId: string;
  @IsNumber() quantity: number;
  @IsNumber() unitPrice: number;
}

class CreateChallanDto {
  @IsString() challanNumber: string;
  @IsString() purchaseDate: string;
  @IsOptional() @IsString() supplierName?: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ChallanItemDto)
  items: ChallanItemDto[];
}

class BulkChallanItemDto {
  @IsString() partSku: string;
  @IsNumber() quantity: number;
  @IsNumber() unitPrice: number;
}

class BulkChallanRowDto {
  @IsString() challanNumber: string;
  @IsString() purchaseDate: string;
  @IsOptional() @IsString() supplierName?: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => BulkChallanItemDto)
  items: BulkChallanItemDto[];
}

class BulkCreateChallansDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => BulkChallanRowDto)
  challans: BulkChallanRowDto[];
}

@ApiTags('parts')
@Controller('parts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PartsController {
  constructor(private svc: PartsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all parts in catalogue' })
  findAll() { return this.svc.findAll(); }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get parts below minimum stock level' })
  lowStock() { return this.svc.getLowStock(); }

  @Get('pending-review')
  @ApiOperation({ summary: 'Get custom parts added by technicians awaiting admin review' })
  pendingReview() { return this.svc.getPendingReview(); }

  @Get('challans')
  @ApiOperation({ summary: 'List all purchase challans' })
  listChallans() { return this.svc.findAllChallans(); }

  @Get('challans/:id')
  @ApiOperation({ summary: 'Get single challan by ID' })
  getOneChallan(@Param('id') id: string) { return this.svc.findOneChallan(id); }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create parts from CSV/array — returns created list and per-row errors' })
  bulkCreate(@Body() dto: BulkCreatePartsDto) { return this.svc.bulkCreate(dto.parts); }

  @Post('challans/bulk')
  @ApiOperation({ summary: 'Bulk create challans from CSV — looks up parts by SKU, partial success per challan' })
  bulkCreateChallans(@Body() dto: BulkCreateChallansDto) { return this.svc.bulkCreateChallans(dto.challans); }

  @Post('challans')
  @ApiOperation({ summary: 'Create purchase challan — adds bought qty to part stock' })
  createChallan(@Body() dto: CreateChallanDto) { return this.svc.createChallan(dto); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  @ApiOperation({ summary: 'Add new part to catalogue' })
  create(@Body() dto: CreatePartDto) { return this.svc.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreatePartDto>) {
    return this.svc.update(id, dto);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a custom part added by a technician' })
  approve(@Param('id') id: string, @Body() dto: Partial<CreatePartDto>) {
    return this.svc.approveCustomPart(id, dto);
  }

  @Patch(':id/set-remaining')
  @ApiOperation({ summary: 'Admin sets actual remaining stock qty at end of month' })
  setRemaining(@Param('id') id: string, @Body() dto: SetRemainingQtyDto) {
    return this.svc.setRemainingQty(id, dto.qty);
  }
}
