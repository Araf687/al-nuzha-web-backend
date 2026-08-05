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
exports.TechniciansService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const technician_entity_1 = require("./entities/technician.entity");
const bcrypt = require("bcrypt");
let TechniciansService = class TechniciansService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll() {
        return this.repo.find({
            where: { isActive: true },
            select: ['id', 'name', 'phone', 'email', 'role', 'isActive', 'createdAt'],
        });
    }
    async findOne(id) {
        const t = await this.repo.findOne({
            where: { id },
            select: ['id', 'name', 'phone', 'email', 'role', 'isActive', 'createdAt'],
        });
        if (!t)
            throw new common_1.NotFoundException('Technician not found');
        return t;
    }
    async create(dto) {
        const exists = await this.repo.findOne({ where: { phone: dto.phone } });
        if (exists)
            throw new common_1.ConflictException('Phone number already registered');
        const hash = await bcrypt.hash(dto.password, 10);
        const t = this.repo.create({
            name: dto.name,
            phone: dto.phone,
            email: dto.email,
            passwordHash: hash,
            role: dto.role || 'technician',
        });
        const saved = await this.repo.save(t);
        const { passwordHash: _, ...result } = saved;
        return result;
    }
    async update(id, dto) {
        const t = await this.repo.findOne({ where: { id } });
        if (!t)
            throw new common_1.NotFoundException('Technician not found');
        Object.assign(t, dto);
        const saved = await this.repo.save(t);
        const { passwordHash: _, ...result } = saved;
        return result;
    }
    async resetPassword(id, newPassword) {
        const t = await this.repo.findOne({ where: { id } });
        if (!t)
            throw new common_1.NotFoundException('Technician not found');
        t.passwordHash = await bcrypt.hash(newPassword, 10);
        await this.repo.save(t);
        return { message: 'Password reset successfully' };
    }
    async savePushToken(id, expoPushToken) {
        await this.repo.update(id, { expoPushToken });
        return { message: 'Push token saved' };
    }
};
exports.TechniciansService = TechniciansService;
exports.TechniciansService = TechniciansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(technician_entity_1.Technician)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TechniciansService);
//# sourceMappingURL=technicians.service.js.map