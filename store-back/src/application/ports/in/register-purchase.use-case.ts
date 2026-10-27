import { PaymentMethod, Purchase, PurchaseLine } from '@domain/model';

export interface RegisterPurchaseCommand {
  userId: string;
  requestId: string;
  paymentMethod: PaymentMethod;
  lines: PurchaseLine[];
}

export abstract class RegisterPurchaseUseCase {
  abstract execute(command: RegisterPurchaseCommand): Promise<Purchase>;
}
