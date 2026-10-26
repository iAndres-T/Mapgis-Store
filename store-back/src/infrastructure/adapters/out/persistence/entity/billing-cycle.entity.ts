import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { ChargeEntity } from './charge.entity';
import { UserEntity } from './user.entity';

/** Una fila por cada "Notificar Cobro": representa el cierre de una quincena. Inmutable. */
@Entity('billing_cycles')
@Index('idx_cycles_closed', ['closedAt']) // "último cobro" para la regla de 10 días
@Check('chk_cycles_total', '"total_amount" > 0')
@Check('chk_cycles_period', '"period_start" IS NULL OR "period_start" < "closed_at"')
export class BillingCycleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // closed_at del ciclo anterior; null en el primer cobro
  @Column({ name: 'period_start', type: 'timestamptz', nullable: true })
  periodStart!: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz' })
  closedAt!: Date;

  @Column({ name: 'total_amount', type: 'integer' })
  totalAmount!: number;

  @Column({ name: 'closed_by', type: 'uuid' })
  closedById!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'closed_by' })
  closedBy!: Relation<UserEntity>;

  @OneToMany(() => ChargeEntity, (c) => c.billingCycle, { cascade: ['insert'] })
  charges!: Relation<ChargeEntity>[];
}
