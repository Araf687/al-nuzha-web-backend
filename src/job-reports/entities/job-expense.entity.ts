import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { JobReport } from './job-report.entity';

@Entity('job_expenses')
export class JobExpense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => JobReport, (jr) => jr.expenses)
  jobReport: JobReport;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;
}
