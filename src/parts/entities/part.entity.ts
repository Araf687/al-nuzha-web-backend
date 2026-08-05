import {
  Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn,
} from 'typeorm';

@Entity('parts_catalogue')
export class Part {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  sku: string;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('int', { default: 0 })
  stockQty: number;

  @Column('int', { default: 3 })
  minStockLevel: number;

  @Column({ default: false })
  needsReview: boolean; // custom part added by technician, pending admin approval

  @UpdateDateColumn()
  updatedAt: Date;
}
