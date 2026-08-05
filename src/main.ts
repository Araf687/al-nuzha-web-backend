import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigin = process.env.CORS_ORIGIN;
  const allowedOrigins = corsOrigin
    ? corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean)
    : ['http://localhost:3000', 'https://yourdomain.com'];

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('Al-Nuzha Tech API')
    .setDescription('AC & Refrigerator Service Management — Dubai')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication')
    .addTag('customers', 'Customer management')
    .addTag('service-requests', 'Service requests & job management')
    .addTag('job-reports', 'Technician job reports')
    .addTag('parts', 'Parts catalogue & inventory')
    .addTag('invoices', 'Billing & invoices')
    .addTag('technicians', 'Staff management')
    .addTag('services-catalogue', 'Services offered')
    .addTag('reviews', 'Customer reviews')
    .addTag('notifications', 'Notification log')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`\n🚀 CoolDesk API running on: http://localhost:${port}/api/v1`);
  console.log(`📖 Swagger docs:            http://localhost:${port}/api/docs\n`);
}

bootstrap();
