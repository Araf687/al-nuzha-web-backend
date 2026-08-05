import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { JobReport } from '../../job-reports/entities/job-report.entity';

export enum PaymentStatus { UNPAID = 'unpaid', PAID = 'paid', PARTIAL = 'partial' }

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceRef: string; // e.g. INV-2047

  @OneToOne(() => JobReport, (jr) => jr.invoice)
  @JoinColumn()
  jobReport: JobReport;

  @ManyToOne(() => Customer, (c) => c.invoices, { eager: true })
  customer: Customer;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  vat: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  paymentMethod: string; // cash | card | due

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  advanceAmount: number;

  @Column({ nullable: true })
  pdfUrl: string;

  @CreateDateColumn()
  issuedAt: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  paidAt: Date;
}
