"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const service_request_entity_1 = require("./entities/service-request.entity");
const customer_entity_1 = require("../customers/entities/customer.entity");
const technician_entity_1 = require("../technicians/entities/technician.entity");
const service_requests_service_1 = require("./service-requests.service");
const service_requests_controller_1 = require("./service-requests.controller");
const push_notification_service_1 = require("../common/push-notification.service");
let ServiceRequestsModule = class ServiceRequestsModule {
};
exports.ServiceRequestsModule = ServiceRequestsModule;
exports.ServiceRequestsModule = ServiceRequestsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([service_request_entity_1.ServiceRequest, customer_entity_1.Customer, technician_entity_1.Technician])],
        controllers: [service_requests_controller_1.ServiceRequestsController],
        providers: [service_requests_service_1.ServiceRequestsService, push_notification_service_1.PushNotificationService],
        exports: [typeorm_1.TypeOrmModule],
    })
], ServiceRequestsModule);
//# sourceMappingURL=service-requests.module.js.map