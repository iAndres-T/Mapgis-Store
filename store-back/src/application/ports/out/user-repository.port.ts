import { Role } from '../../../domain/model/role.enum';
import { User } from '../../../domain/model/user.model';

export abstract class UserRepositoryPort {
  abstract findById(id: string): Promise<User | null>;

  abstract findByIdForUpdate(id: string): Promise<User | null>;

  abstract findAll(role?: Role): Promise<User[]>;

  abstract existsByName(name: string, excludeId?: string): Promise<boolean>;

  abstract save(user: User): Promise<void>;

  abstract softDelete(id: string): Promise<void>;

  abstract increaseDebt(id: string, amount: number): Promise<void>;

  abstract findDebtorsForUpdate(): Promise<User[]>;

  abstract resetDebt(ids: string[]): Promise<void>;
}
