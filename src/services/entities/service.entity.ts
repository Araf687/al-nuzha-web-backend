import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  // Null when isCustomQuote is true — price is calculated after the order
  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: { to: (v: number | null) => v, from: (v: string | null) => (v === null ? null : Number(v)) },
  })
  startingPrice: number | null;

  @Column({ default: false })
  isCustomQuote: boolean;

  // Lower number is shown first
  @Column('int', { default: 0 })
  priority: number;

  // Public path, e.g. /uploads/services/<file>.jpg
  @Column()
  thumbnail: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
