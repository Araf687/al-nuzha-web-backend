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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const customer_entity_1 = require("../customers/entities/customer.entity");
const technician_entity_1 = require("../technicians/entities/technician.entity");
let AuthService = class AuthService {
    constructor(customersRepo, techniciansRepo, jwtService) {
        this.customersRepo = customersRepo;
        this.techniciansRepo = techniciansRepo;
        this.jwtService = jwtService;
    }
    async registerCustomer(data) {
        const exists = await this.customersRepo.findOne({ where: { phone: data.phone } });
        if (exists && exists.isRegistered)
            throw new common_1.BadRequestException('Phone already registered');
        const hash = await bcrypt.hash(data.password, 10);
        if (exists) {
            exists.name = data.name;
            exists.email = data.email;
            exists.passwordHash = hash;
            exists.isRegistered = true;
            await this.customersRepo.save(exists);
            return this.signCustomer(exists);
        }
        const customer = this.customersRepo.create({
            name: data.name,
            phone: data.phone,
            email: data.email,
            passwordHash: hash,
            isRegistered: true,
        });
        await this.customersRepo.save(customer);
        return this.signCustomer(customer);
    }
    async loginCustomer(phone, password) {
        const customer = await this.customersRepo.findOne({ where: { phone, isRegistered: true } });
        if (!customer)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await bcrypt.compare(password, customer.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        return this.signCustomer(customer);
    }
    async loginTechnician(phone, password) {
        const tech = await this.techniciansRepo.findOne({ where: { phone, isActive: true } });
        if (!tech)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await bcrypt.compare(password, tech.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        return this.signTechnician(tech);
    }
    signCustomer(customer) {
        const payload = { sub: customer.id, phone: customer.phone, role: 'customer' };
        return {
            accessToken: this.jwtService.sign(payload),
            user: { id: customer.id, name: customer.name, phone: customer.phone, role: 'customer' },
        };
    }
    signTechnician(tech) {
        const payload = { sub: tech.id, phone: tech.phone, role: tech.role };
        return {
            accessToken: this.jwtService.sign(payload),
            user: { id: tech.id, name: tech.name, phone: tech.phone, role: tech.role },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(1, (0, typeorm_1.InjectRepository)(technician_entity_1.Technician)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map