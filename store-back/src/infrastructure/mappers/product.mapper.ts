import { Product } from '@domain/model';
import { ProductResponse } from '@infrastructure/adapters/in/rest/dto';

export class ProductMapper {
  static toResponse(product: Product): ProductResponse {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      imageUrl: product.image?.url ?? null,
    };
  }
}
