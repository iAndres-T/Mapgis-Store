import {
  AlreadyExistsException,
  ResourceNotFoundException,
} from '@domain/exception';
import { Role, User } from '@domain/model';
import { ManageClientsUseCase } from '@application/ports/in';
import {
  PasswordHasherPort,
  UnitOfWorkPort,
  UserRepositoryPort,
} from '@application/ports/out';

// Las escrituras bloquean la fila: save() reescribe debt y no debe pisar una compra fiada concurrente.
export class ManageClientsService extends ManageClientsUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly hasher: PasswordHasherPort,
    private readonly uow: UnitOfWorkPort,
  ) {
    super();
  }

  async create(name: string): Promise<User> {
    await this.ensureNameIsFree(this.users, name);
    const client = User.create(
      name,
      Role.CLIENT,
      await this.hasher.hash(User.DEFAULT_PASSWORD),
    );
    await this.users.save(client);
    return client;
  }

  rename(id: string, name: string): Promise<User> {
    return this.uow.run(async ({ users }) => {
      const client = await this.findClient(users, id, true);
      await this.ensureNameIsFree(users, name, id);
      client.rename(name);
      await users.save(client);
      return client;
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async ({ users }) => {
      const client = await this.findClient(users, id, true);
      client.ensureCanBeDeleted();
      await users.softDelete(id);
    });
  }

  findById(id: string): Promise<User> {
    return this.findClient(this.users, id, false);
  }

  list(): Promise<User[]> {
    return this.users.findAll(Role.CLIENT);
  }

  async resetPassword(id: string): Promise<void> {
    const hash = await this.hasher.hash(User.DEFAULT_PASSWORD);
    await this.uow.run(async ({ users }) => {
      const client = await this.findClient(users, id, true);
      client.resetPassword(hash);
      await users.save(client);
    });
  }

  // /clients solo opera sobre clientes: un admin se reporta como inexistente.
  private async findClient(
    users: UserRepositoryPort,
    id: string,
    forUpdate: boolean,
  ): Promise<User> {
    const user = forUpdate
      ? await users.findByIdForUpdate(id)
      : await users.findById(id);
    if (!user || user.role !== Role.CLIENT) {
      throw new ResourceNotFoundException('Cliente', id);
    }
    return user;
  }

  private async ensureNameIsFree(
    users: UserRepositoryPort,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    if (await users.existsByName(name.trim(), excludeId)) {
      throw new AlreadyExistsException('El usuario', name.trim());
    }
  }
}
