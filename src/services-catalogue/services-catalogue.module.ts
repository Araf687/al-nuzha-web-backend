import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCatalogue } from './entities/service-catalogue.entity';
import { ServicesCatalogueController } from './services-catalogue.controller';
import { ServicesCatalogueService } from './services-catalogue.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceCatalogue])],
  controllers: [ServicesCatalogueController],
  providers: [ServicesCatalogueService],
})
export class ServicesCatalogueModule {}
