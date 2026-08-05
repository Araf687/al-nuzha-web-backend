import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Part } from './entities/part.entity';
import { PartChallan } from './entities/challan.entity';
import { ChallanItem } from './entities/challan-item.entity';
import { PartsService } from './parts.service';
import { PartsController } from './parts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Part, PartChallan, ChallanItem])],
  controllers: [PartsController],
  providers: [PartsService],
  exports: [TypeOrmModule],
})
export class PartsModule {}
