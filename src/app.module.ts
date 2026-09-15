import { Module } from '@nestjs/common';
import { join, extname } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { TechniciansModule } from './technicians/technicians.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { JobReportsModule } from './job-reports/job-reports.module';
import { PartsModule } from './parts/parts.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ServicesCatalogueModule } from './services-catalogue/services-catalogue.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ServicesModule } from './services/services.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'password'),
        database: config.get('DB_NAME', 'cooldesk'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production', // disable in prod!
        logging: config.get('NODE_ENV') === 'development',
        // Production schema changes come from migrations, applied automatically on startup.
        // extname(__filename) picks .ts (ts-node) or .js (dist) so dist/*.d.ts files are not loaded.
        migrations: [join(__dirname, 'database', 'migrations', `*${extname(__filename)}`)],
        migrationsRun: config.get('NODE_ENV') === 'production',
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    CustomersModule,
    TechniciansModule,
    ServiceRequestsModule,
    JobReportsModule,
    PartsModule,
    InvoicesModule,
    ServicesCatalogueModule,
    ReviewsModule,
    NotificationsModule,
    DashboardModule,
    ServicesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
