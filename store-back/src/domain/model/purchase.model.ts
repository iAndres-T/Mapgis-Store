import { randomUUID } from 'node:crypto';
import { BusinessRuleException } from '../exception/business-rule.exception';
import { InsufficientStockException } from '../exception/insufficient-stock.exception';
import { ResourceNotFoundException } from '../exception/resource-not-found.exception';
import { PaymentMethod } from './payment-method.enum';
import { PaymentStatus } from './payment-status.enum';
import { Product } from './product.model';

export interface PurchaseLine {
  productId: string;
  quantity: number;
}

export class PurchaseItem {
  constructor(
    readonly productId: string,
    readonly quantity: number,
    readonly unitPrice: number,
  ) {}

  get subtotal(): number {
    return this.quantity * this.unitPrice;
  }
}

export interface PurchaseProps {
  id: string;
  requestId: string;
  userId: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  items: PurchaseItem[];
  chargeId: string | null;
  createdAt: Date;
}

export interface NewPurchase {
  userId: string;
  requestId: string;
  paymentMethod: PaymentMethod;
  lines: PurchaseLine[];
  catalog: Product[];
}

export class Purchase {
  readonly id: string;
  readonly requestId: string;
  readonly userId: string;
  readonly paymentMethod: PaymentMethod;
  readonly status: PaymentStatus;
  readonly items: readonly PurchaseItem[];
  readonly chargeId: string | null;
  readonly createdAt: Date;

  private constructor(props: PurchaseProps) {
    this.id = props.id;
    this.requestId = props.requestId;
    this.userId = props.userId;
    this.paymentMethod = props.paymentMethod;
    this.status = props.status;
    this.items = props.items;
    this.chargeId = props.chargeId;
    this.createdAt = props.createdAt;
  }

  /**
   * Agrupa las líneas repetidas, congela el precio actual de cada producto y ordena los items
   * por productId para que el descuento de stock bloquee las filas siempre en el mismo orden.
   */
  static create(data: NewPurchase): Purchase {
    if (data.lines.length === 0) {
      throw new BusinessRuleException(
        'La compra debe tener al menos un producto',
      );
    }

    const quantities = new Map<string, number>();
    for (const line of data.lines) {
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
        throw new BusinessRuleException(
          'La cantidad de cada producto debe ser un número entero mayor a 0',
        );
      }
      quantities.set(
        line.productId,
        (quantities.get(line.productId) ?? 0) + line.quantity,
      );
    }

    const catalog = new Map(data.catalog.map((p) => [p.id, p]));
    const items = [...quantities.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([productId, quantity]) => {
        const product = catalog.get(productId);
        if (!product) {
          throw new ResourceNotFoundException('Producto', productId);
        }
        if (!product.hasStock(quantity)) {
          throw new InsufficientStockException(
            product.name,
            product.stock,
            quantity,
          );
        }
        return new PurchaseItem(productId, quantity, product.price);
      });

    return new Purchase({
      id: randomUUID(),
      requestId: data.requestId,
      userId: data.userId,
      paymentMethod: data.paymentMethod,
      status:
        data.paymentMethod === PaymentMethod.PAID
          ? PaymentStatus.SETTLED
          : PaymentStatus.PENDING,
      items,
      chargeId: null,
      createdAt: new Date(),
    });
  }

  static restore(props: PurchaseProps): Purchase {
    return new Purchase(props);
  }

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  isOnCredit(): boolean {
    return this.paymentMethod === PaymentMethod.ON_CREDIT;
  }
}
