import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';
import { BillingCycleEntity } from './billing-cycle.entity';
import { PurchaseEntity } from './purchase.entity';
import { UserEntity } from './user.entity';

/** Lo que se le cobró a un cliente en una quincena (snapshot: users.debt queda en 0 tras el cierre). */
@Entity('charges')
@Unique('uq_charges_cycle_user', ['billingCycleId', 'userId'])
@Index('idx_charges_user', ['userId']) // historial de cobros por cliente
@Check('chk_charges_amount', '"amount" > 0')
export class ChargeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'billing_cycle_id', type: 'uuid' })
  billingCycleId!: string;

  @ManyToOne(() => BillingCycleEntity, (b) => b.charges, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'billing_cycle_id' })
  billingCycle!: Relation<BillingCycleEntity>;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<UserEntity>;

  @Column({ type: 'integer' })
  amount!: number;

  @OneToMany(() => PurchaseEntity, (p) => p.charge)
  purchases!: Relation<PurchaseEntity>[];
}
