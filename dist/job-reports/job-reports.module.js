"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobReportsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const job_report_entity_1 = require("./entities/job-report.entity");
const job_part_entity_1 = require("./entities/job-part.entity");
const job_service_entity_1 = require("./entities/job-service.entity");
const job_expense_entity_1 = require("./entities/job-expense.entity");
const service_request_entity_1 = require("../service-requests/entities/service-request.entity");
const part_entity_1 = require("../parts/entities/part.entity");
const invoice_entity_1 = require("../invoices/entities/invoice.entity");
const customer_entity_1 = require("../customers/entities/customer.entity");
const job_reports_service_1 = require("./job-reports.service");
const job_reports_controller_1 = require("./job-reports.controller");
let JobReportsModule = class JobReportsModule {
};
exports.JobReportsModule = JobReportsModule;
exports.JobReportsModule = JobReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([job_report_entity_1.JobReport, job_part_entity_1.JobPart, job_service_entity_1.JobService, job_expense_entity_1.JobExpense, service_request_entity_1.ServiceRequest, part_entity_1.Part, invoice_entity_1.Invoice, customer_entity_1.Customer])],
        controllers: [job_reports_controller_1.JobReportsController],
        providers: [job_reports_service_1.JobReportsService],
    })
], JobReportsModule);
//# sourceMappingURL=job-reports.module.js.map