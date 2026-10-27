import { PaymentMethod, PaymentStatus } from '@domain/model';

export interface PurchaseResponse {
  id: string;
  requestId: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  total: number;
  createdAt: Date;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
}
