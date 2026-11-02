import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Technician } from '../../technicians/entities/technician.entity';

// Postgres returns numeric columns as strings; hand them back as numbers
const decimal = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // What was spent
  @Column('decimal', { precision: 10, scale: 2, transformer: decimal })
  cost: number;

  // Where it was spent
  @Column()
  shopName: string;

  // Shop's phone number — optional
  @Column({ nullable: true })
  shopNumber: string;

  // What it was for
  @Column('text', { nullable: true })
  description: string;

  // Day of the spend (date only, no time) — drives the monthly totals
  @Column('date')
  spentAt: string;

  // Who recorded it — technicians only see and edit their own expenses
  @ManyToOne(() => Technician, { nullable: true, onDelete: 'SET NULL' })
  technician: Technician;

  @CreateDateColumn()
  createdAt: Date;
}
