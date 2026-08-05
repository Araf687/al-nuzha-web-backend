import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) private repo: Repository<Notification>) {}

  async send(data: { customerId?: string; serviceRequestId?: string; type: string; channel?: string; message: string }) {
    // In production: call WhatsApp Business API or SMS gateway here
    const n = this.repo.create({
      customer: data.customerId ? { id: data.customerId } as any : null,
      serviceRequestId: data.serviceRequestId,
      type: data.type,
      channel: data.channel || 'whatsapp',
      message: data.message,
      isSent: true, // mark true after successful API call
      sentAt: new Date(),
    });
    return this.repo.save(n);
  }

  findAll() { return this.repo.find({ order: { createdAt: 'DESC' }, take: 100 }); }
}
