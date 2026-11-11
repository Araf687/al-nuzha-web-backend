import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { JobReport } from './job-report.entity';

@Entity('job_services')
export class JobService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => JobReport, (jr) => jr.services)
  jobReport: JobReport;

  @Column()
  serviceName: string;

  @Column('decimal', { precision: 10, scale: 2, default: 1 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  unitPrice: number;

  // Line total: quantity × unitPrice
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  labourCost: number;

  @Column({ nullable: true })
  notes: string;
}
