import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { PartChallan } from './challan.entity';
import { Part } from './part.entity';

@Entity('challan_items')
export class ChallanItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PartChallan, c => c.items, { onDelete: 'CASCADE' })
  challan: PartChallan;

  @ManyToOne(() => Part, { eager: true, nullable: false })
  @JoinColumn()
  part: Part;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;
}
