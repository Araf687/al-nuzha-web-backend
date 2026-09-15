"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const path_1 = require("path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), { prefix: '/uploads/' });
    const corsOrigin = process.env.CORS_ORIGIN;
    const allowedOrigins = corsOrigin
        ? corsOrigin.split(',').map((origin) => origin.trim().replace(/\/+$/, '')).filter(Boolean)
        : ['http://localhost:3000', 'https://alnuzha.ae', 'https://www.alnuzha.ae'];
    app.setGlobalPrefix('api/v1');
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
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
        .addTag('services', 'Services with thumbnail images')
        .addTag('reviews', 'Customer reviews')
        .addTag('notifications', 'Notification log')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`\n🚀 CoolDesk API running on: http://localhost:${port}/api/v1`);
    console.log(`📖 Swagger docs:            http://localhost:${port}/api/docs\n`);
}
bootstrap();
//# sourceMappingURL=main.js.map