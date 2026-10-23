import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { PaymentMethod } from '../../../../../domain/model/payment-method.enum';
import { PaymentStatus } from '../../../../../domain/model/payment-status.enum';
import { ChargeEntity } from './charge.entity';
import { PurchaseItemEntity } from './purchase-item.entity';
import { UserEntity } from './user.entity';

@Entity('purchases')
@Index('idx_purchases_user_created', ['userId', 'createdAt'])
@Index('idx_purchases_created', ['createdAt'])
@Index('idx_purchases_charge', ['chargeId'])
@Check('chk_purchases_total', '"total" > 0')
@Check(
  'chk_purchases_state',
  `("payment_method" = 'PAID'      AND "status" = 'SETTLED' AND "charge_id" IS NULL) OR
  ("payment_method" = 'ON_CREDIT' AND "status" = 'PENDING' AND "charge_id" IS NULL) OR
  ("payment_method" = 'ON_CREDIT' AND "status" = 'SETTLED' AND "charge_id" IS NOT NULL)`,
)
export class PurchaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'request_id', type: 'uuid', unique: true })
  requestId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<UserEntity>;

  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod, enumName: 'payment_method' })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, enumName: 'payment_status' })
  status!: PaymentStatus;

  @Column({ type: 'integer' })
  total!: number;

  @Column({ name: 'charge_id', type: 'uuid', nullable: true })
  chargeId?: string | null;

  @ManyToOne(() => ChargeEntity, (c) => c.purchases, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'charge_id' })
  charge?: Relation<ChargeEntity> | null;

  @OneToMany(() => PurchaseItemEntity, (i) => i.purchase, { cascade: ['insert'] })
  items!: Relation<PurchaseItemEntity>[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
