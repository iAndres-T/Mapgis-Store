import { Purchase } from '@domain/model';
import { PurchaseResponse } from '@infrastructure/adapters/in/rest/dto';

export class PurchaseMapper {
  static toResponse(purchase: Purchase): PurchaseResponse {
    return {
      id: purchase.id,
      requestId: purchase.requestId,
      paymentMethod: purchase.paymentMethod,
      status: purchase.status,
      total: purchase.total,
      createdAt: purchase.createdAt,
      items: purchase.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
    };
  }
}
