import { Product } from '@domain/model';

export abstract class ProductRepositoryPort {
  abstract findById(id: string): Promise<Product | null>;

  abstract findByIdForUpdate(id: string): Promise<Product | null>;

  abstract findByIds(ids: string[]): Promise<Product[]>;

  abstract findAll(search?: string): Promise<Product[]>;

  abstract existsByName(name: string, excludeId?: string): Promise<boolean>;

  abstract save(product: Product): Promise<void>;

  abstract softDelete(id: string): Promise<void>;

  abstract decrementStock(id: string, quantity: number): Promise<boolean>;
}
