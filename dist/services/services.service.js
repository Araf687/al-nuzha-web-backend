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
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const service_entity_1 = require("./entities/service.entity");
let ServicesService = class ServicesService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll() { return this.repo.find({ order: { priority: 'ASC', createdAt: 'DESC' } }); }
    async findOne(id) {
        const s = await this.repo.findOne({ where: { id } });
        if (!s)
            throw new common_1.NotFoundException('Service not found');
        return s;
    }
    create(dto) {
        const s = this.repo.create(dto);
        this.applyPriceRule(s);
        return this.repo.save(s);
    }
    async update(id, dto) {
        const s = await this.findOne(id);
        const oldThumbnail = s.thumbnail;
        Object.assign(s, dto);
        this.applyPriceRule(s);
        const saved = await this.repo.save(s);
        if (dto.thumbnail && oldThumbnail !== dto.thumbnail)
            await this.removeFile(oldThumbnail);
        return saved;
    }
    async remove(id) {
        const s = await this.findOne(id);
        await this.repo.remove(s);
        await this.removeFile(s.thumbnail);
        return { message: 'Service deleted successfully' };
    }
    applyPriceRule(s) {
        if (s.isCustomQuote) {
            s.startingPrice = null;
        }
        else if (s.startingPrice === null || s.startingPrice === undefined) {
            throw new common_1.BadRequestException('startingPrice is required unless isCustomQuote is true');
        }
    }
    async removeFile(publicPath) {
        if (!publicPath?.startsWith('/uploads/'))
            return;
        await (0, promises_1.unlink)((0, path_1.join)(process.cwd(), publicPath)).catch(() => undefined);
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_entity_1.Service)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ServicesService);
//# sourceMappingURL=services.service.js.map