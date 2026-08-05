import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { JobReport } from './job-report.entity';
import { Part } from '../../parts/entities/part.entity';

@Entity('job_parts')
export class JobPart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => JobReport, (jr) => jr.parts)
  jobReport: JobReport;

  @ManyToOne(() => Part, { nullable: true, eager: true })
  part: Part;

  @Column({ nullable: true })
  customPartName: string; // used when part is null (not in catalogue)

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  lineTotal: number;

  @Column({ default: false })
  isCustom: boolean; // true = not from catalogue, needs review
}
