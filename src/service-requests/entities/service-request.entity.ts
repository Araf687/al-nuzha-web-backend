import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, OneToOne, JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Technician } from '../../technicians/entities/technician.entity';
import { JobReport } from '../../job-reports/entities/job-report.entity';

export enum RequestSource { PHONE = 'phone', WEBSITE = 'website' }
export enum RequestStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('service_requests')
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  jobRef: string; // e.g. JOB-2047

  @Column({ type: 'enum', enum: RequestSource, default: RequestSource.PHONE })
  source: RequestSource;

  @Column()
  serviceType: string;

  @Column({ nullable: true })
  equipmentType: string; // AC | Refrigerator | Freezer

  @Column({ nullable: true })
  equipmentBrand: string;

  @Column({ nullable: true })
  equipmentModel: string;

  @Column('text')
  problemDescription: string;

  @Column()
  address: string;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  lat: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  lng: number;

  @Column({ nullable: true })
  preferredTime: string;

  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDING })
  status: RequestStatus;

  @Column({ default: false })
  isRecurring: boolean;

  // Self-referencing: recurring job points to original
  @Column({ nullable: true })
  parentJobId: string;

  @ManyToOne(() => Customer, (c) => c.serviceRequests, { eager: true })
  customer: Customer;

  @ManyToOne(() => Technician, (t) => t.assignedRequests, { nullable: true, eager: true })
  assignedTechnician: Technician;

  @OneToOne(() => JobReport, (jr) => jr.serviceRequest)
  jobReport: JobReport;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  scheduledAt: Date;
}
