import { ResourceNotFoundException } from '@domain/exception';
import { User } from '@domain/model';
import { QueryMyAccountUseCase } from '@application/ports/in';
import {
  PurchaseRepositoryPort,
  PurchaseSummary,
  UserRepositoryPort,
} from '@application/ports/out';

export class QueryMyAccountService extends QueryMyAccountUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly purchases: PurchaseRepositoryPort,
  ) {
    super();
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) throw new ResourceNotFoundException('Usuario', userId);
    return user;
  }

  listPurchases(userId: string): Promise<PurchaseSummary[]> {
    return this.purchases.findSummariesByUser(userId);
  }
}
