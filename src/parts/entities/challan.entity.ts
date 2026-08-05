import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany,
} from 'typeorm';
import { ChallanItem } from './challan-item.entity';

@Entity('part_challans')
export class PartChallan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  challanNumber: string;

  @Column({ type: 'date' })
  purchaseDate: string;

  @Column({ nullable: true })
  supplierName: string;

  @OneToMany(() => ChallanItem, item => item.challan, { cascade: true, eager: true })
  items: ChallanItem[];

  @CreateDateColumn()
  createdAt: Date;
}
