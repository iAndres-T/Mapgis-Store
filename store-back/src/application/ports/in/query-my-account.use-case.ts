import { User } from '@domain/model';
import { PurchaseSummary } from '@application/ports/out';

export abstract class QueryMyAccountUseCase {
  abstract getProfile(userId: string): Promise<User>;

  abstract listPurchases(userId: string): Promise<PurchaseSummary[]>;
}
