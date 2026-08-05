import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, OneToMany,
} from 'typeorm';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';
import { JobReport } from '../../job-reports/entities/job-report.entity';

@Entity('technicians')
export class Technician {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ default: 'technician' })
  role: string; // technician | senior_technician | admin

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  expoPushToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ServiceRequest, (sr) => sr.assignedTechnician)
  assignedRequests: ServiceRequest[];

  @OneToMany(() => JobReport, (jr) => jr.technician)
  jobReports: JobReport[];
}
