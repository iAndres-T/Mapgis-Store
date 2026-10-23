import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';
import { ProductEntity } from './product.entity';
import { PurchaseEntity } from './purchase.entity';

@Entity('purchase_items')
@Unique('uq_items_purchase_product', ['purchaseId', 'productId'])
@Index('idx_items_product', ['productId'])
@Check('chk_items_quantity', '"quantity" > 0')
@Check('chk_items_unit_price', '"unit_price" > 0')
export class PurchaseItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'purchase_id', type: 'uuid' })
  purchaseId!: string;

  @ManyToOne(() => PurchaseEntity, (p) => p.items, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'purchase_id' })
  purchase!: Relation<PurchaseEntity>;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Relation<ProductEntity>;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ name: 'unit_price', type: 'integer' })
  unitPrice!: number;
}
