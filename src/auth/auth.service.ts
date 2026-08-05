import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Customer } from '../customers/entities/customer.entity';
import { Technician } from '../technicians/entities/technician.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Customer)
    private customersRepo: Repository<Customer>,
    @InjectRepository(Technician)
    private techniciansRepo: Repository<Technician>,
    private jwtService: JwtService,
  ) {}

  // ── Customer register ──────────────────────────────────────────────────────
  async registerCustomer(data: { name: string; phone: string; email?: string; password: string }) {
    const exists = await this.customersRepo.findOne({ where: { phone: data.phone } });
    if (exists && exists.isRegistered) throw new BadRequestException('Phone already registered');

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

  // ── Customer login ─────────────────────────────────────────────────────────
  async loginCustomer(phone: string, password: string) {
    const customer = await this.customersRepo.findOne({ where: { phone, isRegistered: true } });
    if (!customer) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return this.signCustomer(customer);
  }

  // ── Technician login ───────────────────────────────────────────────────────
  async loginTechnician(phone: string, password: string) {
    const tech = await this.techniciansRepo.findOne({ where: { phone, isActive: true } });
    if (!tech) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, tech.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return this.signTechnician(tech);
  }

  private signCustomer(customer: Customer) {
    const payload = { sub: customer.id, phone: customer.phone, role: 'customer' };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: customer.id, name: customer.name, phone: customer.phone, role: 'customer' },
    };
  }

  private signTechnician(tech: Technician) {
    const payload = { sub: tech.id, phone: tech.phone, role: tech.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: tech.id, name: tech.name, phone: tech.phone, role: tech.role },
    };
  }
}
