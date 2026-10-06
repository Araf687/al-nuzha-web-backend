import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Technician } from '../../technicians/entities/technician.entity';

// Postgres returns numeric columns as strings; hand them back as numbers
const decimal = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity('fuel_logs')
export class FuelLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Litres of petrol put into the car
  @Column('decimal', { precision: 10, scale: 2, transformer: decimal })
  litres: number;

  // What that refill cost
  @Column('decimal', { precision: 10, scale: 2, transformer: decimal })
  cost: number;

  // Day of the refill (date only, no time)
  @Column('date')
  filledAt: string;

  // Who filled the car — technicians only see and edit their own refills
  @ManyToOne(() => Technician, { nullable: true, onDelete: 'SET NULL' })
  technician: Technician;

  @CreateDateColumn()
  createdAt: Date;
}
