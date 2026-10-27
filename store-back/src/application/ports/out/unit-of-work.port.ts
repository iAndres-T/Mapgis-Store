import { BillingRepositoryPort } from './billing-repository.port';
import { ProductRepositoryPort } from './product-repository.port';
import { PurchaseRepositoryPort } from './purchase-repository.port';
import { UserRepositoryPort } from './user-repository.port';

export interface TransactionalRepositories {
  users: UserRepositoryPort;
  products: ProductRepositoryPort;
  purchases: PurchaseRepositoryPort;
  billing: BillingRepositoryPort;
}

export abstract class UnitOfWorkPort {
  abstract run<T>(
    work: (repos: TransactionalRepositories) => Promise<T>,
  ): Promise<T>;
}
