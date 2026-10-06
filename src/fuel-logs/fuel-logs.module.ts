import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FuelLog } from './entities/fuel-log.entity';
import { FuelLogsController } from './fuel-logs.controller';
import { FuelLogsService } from './fuel-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([FuelLog])],
  controllers: [FuelLogsController],
  providers: [FuelLogsService],
})
export class FuelLogsModule {}
