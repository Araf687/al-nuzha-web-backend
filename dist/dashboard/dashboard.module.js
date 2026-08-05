"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const service_request_entity_1 = require("../service-requests/entities/service-request.entity");
const invoice_entity_1 = require("../invoices/entities/invoice.entity");
const job_report_entity_1 = require("../job-reports/entities/job-report.entity");
const challan_entity_1 = require("../parts/entities/challan.entity");
const part_entity_1 = require("../parts/entities/part.entity");
const dashboard_service_1 = require("./dashboard.service");
const dashboard_controller_1 = require("./dashboard.controller");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([service_request_entity_1.ServiceRequest, invoice_entity_1.Invoice, job_report_entity_1.JobReport, challan_entity_1.PartChallan, part_entity_1.Part]),
        ],
        providers: [dashboard_service_1.DashboardService],
        controllers: [dashboard_controller_1.DashboardController],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map