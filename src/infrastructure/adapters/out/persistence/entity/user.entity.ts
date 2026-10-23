import {
  Check,
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../../../../../domain/model/role.enum';
import { TimestampedEntity } from './timestamped.entity';

@Entity('users')
@Index('uq_users_name', ['name'], { unique: true, where: '"deleted_at" IS NULL' })
@Check('chk_users_debt', '"debt" >= 0')
@Check('chk_users_phone', `"phone" IS NULL OR "phone" ~ '^573[0-9]{9}$'`)
export class UserEntity extends TimestampedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'enum', enum: Role, enumName: 'user_role', default: Role.CLIENT })
  role!: Role;

  @Column({ name: 'password_hash', type: 'varchar', length: 100, select: false })
  passwordHash!: string;

  @Column({ name: 'must_change_password', type: 'boolean', default: true })
  mustChangePassword!: boolean;

  @Column({ type: 'varchar', length: 12, nullable: true })
  phone?: string | null;

  @Column({ type: 'integer', default: 0 })
  debt!: number;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date | null;
}
