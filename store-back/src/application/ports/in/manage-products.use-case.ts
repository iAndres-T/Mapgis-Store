import { Product, ProductData } from '@domain/model';
import { ImageFile } from '@application/ports/out';

export interface CreateProductCommand extends ProductData {
  image?: ImageFile;
}

export interface UpdateProductCommand extends Partial<ProductData> {
  image?: ImageFile;
}

export abstract class ManageProductsUseCase {
  abstract create(command: CreateProductCommand): Promise<Product>;

  abstract update(id: string, command: UpdateProductCommand): Promise<Product>;

  abstract delete(id: string): Promise<void>;

  abstract findById(id: string): Promise<Product>;

  abstract list(search?: string): Promise<Product[]>;
}
