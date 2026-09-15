import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException, ParseUUIDPipe, Injectable, NestInterceptor,
  ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { unlink } from 'fs/promises';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsInt, Min, MaxLength, ValidateIf } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

const UPLOAD_DIR = 'uploads/services';

// Multipart fields arrive as strings: "true"/"false" -> boolean, anything else left for @IsBoolean to reject
const toBoolean = ({ value }: { value: unknown }) =>
  value === 'true' || value === true ? true : value === 'false' || value === false ? false : value;

class CreateServiceDto {
  @IsString() @IsNotEmpty() @MaxLength(150) title: string;

  @IsOptional() @Transform(toBoolean) @IsBoolean() isCustomQuote?: boolean;

  // Required unless isCustomQuote is true
  @ValidateIf((o) => !o.isCustomQuote) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  startingPrice?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) priority?: number;
}

class UpdateServiceDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(150) title?: string;
  @IsOptional() @Transform(toBoolean) @IsBoolean() isCustomQuote?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) startingPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) priority?: number;
}

interface UploadedImage { filename: string }

const thumbnailInterceptor = FileInterceptor('thumbnail', {
  storage: diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      return cb(new BadRequestException('thumbnail must be a jpg, png, webp or gif image'), false);
    }
    cb(null, true);
  },
});

// Deletes the uploaded file if validation or the handler fails, so no orphan images are left.
@Injectable()
class RemoveUploadOnError implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    return next.handle().pipe(
      catchError((err) => {
        if (req.file?.path) unlink(req.file.path).catch(() => undefined);
        return throwError(() => err);
      }),
    );
  }
}

const serviceFormSchema =(required: string[]) => ({
  schema: {
    type: 'object',
    required,
    properties: {
      title: { type: 'string', example: 'AC Repair' },
      isCustomQuote: { type: 'boolean', example: false, description: 'When true, startingPrice is not needed' },
      startingPrice: { type: 'number', example: 150, description: 'Required unless isCustomQuote is true' },
      priority: { type: 'integer', example: 1, description: 'Lower number is shown first (default 0)' },
      thumbnail: { type: 'string', format: 'binary' },
    },
  },
});

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private svc: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all services (public)' })
  findAll() { return this.svc.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Get one service (public)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a service (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(serviceFormSchema(['title', 'thumbnail']))
  @UseInterceptors(thumbnailInterceptor, RemoveUploadOnError)
  async create(@Body() dto: CreateServiceDto, @UploadedFile() file: UploadedImage) {
    if (!file) throw new BadRequestException('thumbnail image is required');
    return this.svc.create({ ...dto, thumbnail: `/${UPLOAD_DIR}/${file.filename}` });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a service; all fields optional (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(serviceFormSchema([]))
  @UseInterceptors(thumbnailInterceptor, RemoveUploadOnError)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
    @UploadedFile() file?: UploadedImage,
  ) {
    return this.svc.update(id, { ...dto, ...(file && { thumbnail: `/${UPLOAD_DIR}/${file.filename}` }) });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a service and its thumbnail (admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}
