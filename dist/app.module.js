"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const customers_module_1 = require("./customers/customers.module");
const technicians_module_1 = require("./technicians/technicians.module");
const service_requests_module_1 = require("./service-requests/service-requests.module");
const job_reports_module_1 = require("./job-reports/job-reports.module");
const parts_module_1 = require("./parts/parts.module");
const invoices_module_1 = require("./invoices/invoices.module");
const services_catalogue_module_1 = require("./services-catalogue/services-catalogue.module");
const reviews_module_1 = require("./reviews/reviews.module");
const notifications_module_1 = require("./notifications/notifications.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const health_controller_1 = require("./health/health.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST', 'localhost'),
                    port: config.get('DB_PORT', 5432),
                    username: config.get('DB_USERNAME', 'postgres'),
                    password: config.get('DB_PASSWORD', 'password'),
                    database: config.get('DB_NAME', 'cooldesk'),
                    autoLoadEntities: true,
                    synchronize: config.get('NODE_ENV') !== 'production',
                    logging: config.get('NODE_ENV') === 'development',
                }),
                inject: [config_1.ConfigService],
            }),
            auth_module_1.AuthModule,
            customers_module_1.CustomersModule,
            technicians_module_1.TechniciansModule,
            service_requests_module_1.ServiceRequestsModule,
            job_reports_module_1.JobReportsModule,
            parts_module_1.PartsModule,
            invoices_module_1.InvoicesModule,
            services_catalogue_module_1.ServicesCatalogueModule,
            reviews_module_1.ReviewsModule,
            notifications_module_1.NotificationsModule,
            dashboard_module_1.DashboardModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map