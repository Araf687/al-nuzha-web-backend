"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobExpense = void 0;
const typeorm_1 = require("typeorm");
const job_report_entity_1 = require("./job-report.entity");
let JobExpense = class JobExpense {
};
exports.JobExpense = JobExpense;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], JobExpense.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => job_report_entity_1.JobReport, (jr) => jr.expenses),
    __metadata("design:type", job_report_entity_1.JobReport)
], JobExpense.prototype, "jobReport", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], JobExpense.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], JobExpense.prototype, "amount", void 0);
exports.JobExpense = JobExpense = __decorate([
    (0, typeorm_1.Entity)('job_expenses')
], JobExpense);
//# sourceMappingURL=job-expense.entity.js.map