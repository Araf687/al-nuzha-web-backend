import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, OneToMany,
} from 'typeorm';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  lat: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  lng: number;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ default: false })
  isRegistered: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ServiceRequest, (sr) => sr.customer)
  serviceRequests: ServiceRequest[];

  @OneToMany(() => Invoice, (inv) => inv.customer)
  invoices: Invoice[];

  @OneToMany(() => Review, (r) => r.customer)
  reviews: Review[];

  @OneToMany(() => Notification, (n) => n.customer)
  notifications: Notification[];
}
