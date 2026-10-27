import { PaymentMethod } from '../../../domain/model/payment-method.enum';
import { Purchase, PurchaseLine } from '../../../domain/model/purchase.model';

export interface RegisterPurchaseCommand {
  userId: string;
  requestId: string;
  paymentMethod: PaymentMethod;
  lines: PurchaseLine[];
}

export abstract class RegisterPurchaseUseCase {
  abstract execute(command: RegisterPurchaseCommand): Promise<Purchase>;
}
