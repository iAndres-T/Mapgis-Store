import { User } from '../../../domain/model/user.model';

export abstract class ManageClientsUseCase {
  abstract create(name: string): Promise<User>;

  abstract rename(id: string, name: string): Promise<User>;

  abstract delete(id: string): Promise<void>;

  abstract findById(id: string): Promise<User>;

  abstract list(): Promise<User[]>;

  abstract resetPassword(id: string): Promise<void>;
}
