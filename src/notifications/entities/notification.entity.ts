import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Customer, (c) => c.notifications, { nullable: true })
  customer: Customer;

  @Column({ nullable: true })
  serviceRequestId: string;

  @Column()
  type: string; // request_received | technician_assigned | job_completed | low_stock | recurring

  @Column({ default: 'whatsapp' })
  channel: string; // whatsapp | sms | email

  @Column('text')
  message: string;

  @Column({ default: false })
  isSent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  sentAt: Date;
}
