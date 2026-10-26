import {
  Check,
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TimestampedEntity } from './timestamped.entity';

@Entity('products')
@Index('uq_products_name', ['name'], { unique: true, where: '"deleted_at" IS NULL' })
@Check('chk_products_price', '"price" > 0')
@Check('chk_products_stock', '"stock" >= 0')
export class ProductEntity extends TimestampedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'integer' })
  price!: number;

  @Column({ type: 'integer', default: 0 })
  stock!: number;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string | null;

  @Column({ name: 'image_public_id', type: 'varchar', length: 255, nullable: true })
  imagePublicId?: string | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date | null;
}
