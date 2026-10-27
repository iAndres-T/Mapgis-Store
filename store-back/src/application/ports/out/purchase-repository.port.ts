import { PaymentMethod } from '../../../domain/model/payment-method.enum';
import { PaymentStatus } from '../../../domain/model/payment-status.enum';
import { Purchase } from '../../../domain/model/purchase.model';

// Modelo de lectura para el historial: incluye el nombre del producto
export interface PurchaseSummary {
  id: string;
  createdAt: Date;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  total: number;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export abstract class PurchaseRepositoryPort {
  abstract findByRequestId(requestId: string): Promise<Purchase | null>;

  abstract save(purchase: Purchase): Promise<void>;

  abstract settlePending(userId: string, chargeId: string): Promise<void>;

  abstract findSummariesByUser(userId: string): Promise<PurchaseSummary[]>;
}
