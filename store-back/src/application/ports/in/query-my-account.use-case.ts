import { User } from '../../../domain/model/user.model';
import { PurchaseSummary } from '../out/purchase-repository.port';

export abstract class QueryMyAccountUseCase {
  abstract getProfile(userId: string): Promise<User>;

  abstract listPurchases(userId: string): Promise<PurchaseSummary[]>;
}
