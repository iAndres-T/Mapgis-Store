import { randomUUID } from 'node:crypto';
import { BusinessRuleException } from '../exception/business-rule.exception';

export interface ProductImage {
  url: string;
  publicId: string;
}

export interface ProductProps {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: ProductImage | null;
}

export interface ProductData {
  name: string;
  price: number;
  stock: number;
}

export class Product {
  static readonly MAX_NAME_LENGTH = 120;

  private constructor(private readonly props: ProductProps) {}

  static create(data: ProductData): Product {
    return new Product({
      id: randomUUID(),
      name: Product.validateName(data.name),
      price: Product.validatePrice(data.price),
      stock: Product.validateStock(data.stock),
      image: null,
    });
  }

  static restore(props: ProductProps): Product {
    return new Product({ ...props });
  }

  private static validateName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed.length > Product.MAX_NAME_LENGTH) {
      throw new BusinessRuleException(
        `El nombre del producto es obligatorio y debe tener máximo ${Product.MAX_NAME_LENGTH} caracteres`,
      );
    }
    return trimmed;
  }

  private static validatePrice(price: number): number {
    if (!Number.isInteger(price) || price <= 0) {
      throw new BusinessRuleException(
        'El precio debe ser un valor entero en pesos mayor a 0',
      );
    }
    return price;
  }

  private static validateStock(stock: number): number {
    if (!Number.isInteger(stock) || stock < 0) {
      throw new BusinessRuleException(
        'El stock debe ser un número entero mayor o igual a 0',
      );
    }
    return stock;
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get price(): number {
    return this.props.price;
  }

  get stock(): number {
    return this.props.stock;
  }

  get image(): ProductImage | null {
    return this.props.image;
  }

  hasStock(quantity: number): boolean {
    return this.props.stock >= quantity;
  }

  update(changes: Partial<ProductData>): void {
    if (changes.name !== undefined) {
      this.props.name = Product.validateName(changes.name);
    }
    if (changes.price !== undefined) {
      this.props.price = Product.validatePrice(changes.price);
    }
    if (changes.stock !== undefined) {
      this.props.stock = Product.validateStock(changes.stock);
    }
  }

  // Devuelve la imagen anterior para que el caso de uso la elimine del storage.
  replaceImage(image: ProductImage | null): ProductImage | null {
    const previous = this.props.image;
    this.props.image = image;
    return previous;
  }
}
