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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRequestsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const service_request_entity_1 = require("./entities/service-request.entity");
const customer_entity_1 = require("../customers/entities/customer.entity");
const technician_entity_1 = require("../technicians/entities/technician.entity");
const push_notification_service_1 = require("../common/push-notification.service");
let ServiceRequestsService = class ServiceRequestsService {
    constructor(repo, customersRepo, techRepo, pushService) {
        this.repo = repo;
        this.customersRepo = customersRepo;
        this.techRepo = techRepo;
        this.pushService = pushService;
    }
    generateJobRef() {
        const num = Math.floor(1000 + Math.random() * 9000);
        return `JOB-${num}`;
    }
    async notifyTechnician(technicianId, jobRef, jobId) {
        const tech = await this.techRepo.findOne({ where: { id: technicianId } });
        if (tech?.expoPushToken) {
            await this.pushService.send(tech.expoPushToken, 'New Job Assigned', `Job ${jobRef} has been assigned to you.`, { jobId });
        }
    }
    async create(dto) {
        let customer = await this.customersRepo.findOne({ where: { phone: dto.phone } });
        if (!customer) {
            customer = this.customersRepo.create({
                name: dto.name,
                phone: dto.phone,
                address: dto.address,
                lat: dto.lat,
                lng: dto.lng,
            });
            await this.customersRepo.save(customer);
        }
        const req = this.repo.create({
            jobRef: this.generateJobRef(),
            source: dto.source || service_request_entity_1.RequestSource.WEBSITE,
            serviceType: dto.serviceType,
            equipmentType: dto.equipmentType,
            equipmentBrand: dto.equipmentBrand,
            equipmentModel: dto.equipmentModel,
            problemDescription: dto.problemDescription,
            address: dto.address || customer.address,
            lat: dto.lat,
            lng: dto.lng,
            preferredTime: dto.preferredTime,
            customer,
            isRecurring: false,
        });
        if (dto.technicianId) {
            req.assignedTechnician = { id: dto.technicianId };
            req.status = service_request_entity_1.RequestStatus.ASSIGNED;
        }
        const saved = await this.repo.save(req);
        if (dto.technicianId) {
            await this.notifyTechnician(dto.technicianId, saved.jobRef, saved.id);
        }
        return saved;
    }
    async createRecurring(parentJobId, recurringDescription, customerId) {
        const parent = await this.repo.findOne({
            where: { id: parentJobId },
            relations: ['customer'],
        });
        if (!parent)
            throw new common_1.NotFoundException('Parent job not found');
        if (parent.customer.id !== customerId)
            throw new common_1.NotFoundException('Job not found for this customer');
        const req = this.repo.create({
            jobRef: this.generateJobRef(),
            source: service_request_entity_1.RequestSource.WEBSITE,
            serviceType: parent.serviceType,
            equipmentType: parent.equipmentType,
            equipmentBrand: parent.equipmentBrand,
            equipmentModel: parent.equipmentModel,
            problemDescription: recurringDescription,
            address: parent.address,
            lat: parent.lat,
            lng: parent.lng,
            customer: parent.customer,
            isRecurring: true,
            parentJobId: parent.id,
        });
        return this.repo.save(req);
    }
    async findAll(filters) {
        const qb = this.repo.createQueryBuilder('sr')
            .leftJoinAndSelect('sr.customer', 'customer')
            .leftJoinAndSelect('sr.assignedTechnician', 'tech')
            .leftJoinAndSelect('sr.jobReport', 'jobReport')
            .leftJoinAndSelect('jobReport.invoice', 'invoice')
            .orderBy('sr.createdAt', 'DESC');
        if (filters.status)
            qb.andWhere('sr.status = :status', { status: filters.status });
        if (filters.technicianId)
            qb.andWhere('tech.id = :techId', { techId: filters.technicianId });
        if (filters.isRecurring !== undefined)
            qb.andWhere('sr.isRecurring = :r', { r: filters.isRecurring });
        return qb.getMany();
    }
    async findByCustomer(customerId) {
        return this.repo.find({
            where: { customer: { id: customerId } },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const req = await this.repo.findOne({
            where: { id },
            relations: [
                'customer',
                'assignedTechnician',
                'jobReport',
                'jobReport.technician',
                'jobReport.parts',
                'jobReport.parts.part',
                'jobReport.services',
                'jobReport.expenses',
                'jobReport.invoice',
            ],
        });
        if (!req)
            throw new common_1.NotFoundException('Service request not found');
        return req;
    }
    async findOneForUpdate(id) {
        const req = await this.repo.findOne({
            where: { id },
            relations: ['customer', 'assignedTechnician'],
        });
        if (!req)
            throw new common_1.NotFoundException('Service request not found');
        return req;
    }
    async assign(id, technicianId) {
        const req = await this.findOneForUpdate(id);
        req.assignedTechnician = { id: technicianId };
        req.status = service_request_entity_1.RequestStatus.ASSIGNED;
        await this.repo.save(req);
        await this.notifyTechnician(technicianId, req.jobRef, req.id);
        return this.findOne(id);
    }
    async updateStatus(id, status) {
        const req = await this.findOneForUpdate(id);
        req.status = status;
        await this.repo.save(req);
        return this.findOne(id);
    }
    async getMonthlyStats() {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const total = await this.repo.count({ where: { status: service_request_entity_1.RequestStatus.COMPLETED } });
        const thisMonth = await this.repo
            .createQueryBuilder('sr')
            .where('sr.createdAt >= :start', { start })
            .andWhere('sr.status = :s', { s: service_request_entity_1.RequestStatus.COMPLETED })
            .getCount();
        const recurring = await this.repo.count({ where: { isRecurring: true } });
        const pending = await this.repo.count({ where: { status: service_request_entity_1.RequestStatus.PENDING } });
        return { total, thisMonth, recurring, pending };
    }
};
exports.ServiceRequestsService = ServiceRequestsService;
exports.ServiceRequestsService = ServiceRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_request_entity_1.ServiceRequest)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(2, (0, typeorm_1.InjectRepository)(technician_entity_1.Technician)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        push_notification_service_1.PushNotificationService])
], ServiceRequestsService);
//# sourceMappingURL=service-requests.service.js.map