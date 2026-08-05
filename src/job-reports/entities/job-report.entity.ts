import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToOne, OneToMany, JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';
import { Technician } from '../../technicians/entities/technician.entity';
import { JobPart } from './job-part.entity';
import { JobService } from './job-service.entity';
import { JobExpense } from './job-expense.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';

@Entity('job_reports')
export class JobReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => ServiceRequest, (sr) => sr.jobReport)
  @JoinColumn()
  serviceRequest: ServiceRequest;

  @ManyToOne(() => Technician, (t) => t.jobReports, { eager: true })
  technician: Technician;

  @Column()
  faultFound: string;

  @Column('text', { nullable: true })
  diagnosisNotes: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  labourCharge: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  partsTotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  extraExpensesTotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  vatAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  grandTotal: number;

  @Column({ nullable: true })
  customerSignatureUrl: string;

  @Column({ nullable: true, type: 'timestamptz' })
  arrivedAt: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => JobPart, (p) => p.jobReport, { cascade: true, eager: true })
  parts: JobPart[];

  @OneToMany(() => JobService, (s) => s.jobReport, { cascade: true, eager: true })
  services: JobService[];

  @OneToMany(() => JobExpense, (e) => e.jobReport, { cascade: true, eager: true })
  expenses: JobExpense[];

  @OneToOne(() => Invoice, (inv) => inv.jobReport)
  invoice: Invoice;
}
