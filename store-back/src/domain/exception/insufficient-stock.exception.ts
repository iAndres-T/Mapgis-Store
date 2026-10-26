import { DomainException } from './domain.exception';

export class InsufficientStockException extends DomainException {
  constructor(productName: string, available: number, requested: number) {
    super(
      `Stock insuficiente para '${productName}'. Disponible: ${available}, solicitado: ${requested}`,
    );
  }
}
