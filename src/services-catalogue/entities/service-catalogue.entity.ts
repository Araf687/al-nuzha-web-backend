import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('services_catalogue')
export class ServiceCatalogue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  basePrice: number;

  @Column({ default: 'Price on inspection' })
  priceLabel: string;

  @Column({ default: true })
  isActive: boolean;

  @Column('int', { default: 0 })
  displayOrder: number;
}
