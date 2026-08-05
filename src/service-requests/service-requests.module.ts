import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequest } from './entities/service-request.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Technician } from '../technicians/entities/technician.entity';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestsController } from './service-requests.controller';
import { PushNotificationService } from '../common/push-notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceRequest, Customer, Technician])],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService, PushNotificationService],
  exports: [TypeOrmModule],
})
export class ServiceRequestsModule {}
