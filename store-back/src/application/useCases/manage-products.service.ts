import {
  AlreadyExistsException,
  ResourceNotFoundException,
} from '@domain/exception';
import { Product, ProductImage } from '@domain/model';
import {
  CreateProductCommand,
  ManageProductsUseCase,
  UpdateProductCommand,
} from '@application/ports/in';
import {
  ImageFile,
  ImageStoragePort,
  ProductRepositoryPort,
  UnitOfWorkPort,
} from '@application/ports/out';

export class ManageProductsService extends ManageProductsUseCase {
  constructor(
    private readonly products: ProductRepositoryPort,
    private readonly images: ImageStoragePort,
    private readonly uow: UnitOfWorkPort,
  ) {
    super();
  }

  async create({ image, ...data }: CreateProductCommand): Promise<Product> {
    const product = Product.create(data);
    if (await this.products.existsByName(product.name)) {
      throw new AlreadyExistsException('El producto', product.name);
    }

    const uploaded = await this.upload(image);
    product.replaceImage(uploaded);
    await this.withImageRollback(uploaded, () => this.products.save(product));
    return product;
  }

  // La imagen se sube antes de la transacción para no retener el bloqueo durante la llamada de red.
  async update(
    id: string,
    { image, ...changes }: UpdateProductCommand,
  ): Promise<Product> {
    const uploaded = await this.upload(image);

    const { product, previous } = await this.withImageRollback(uploaded, () =>
      this.uow.run(async ({ products }) => {
        const product = await products.findByIdForUpdate(id);
        if (!product) throw new ResourceNotFoundException('Producto', id);

        product.update(changes);
        if (
          changes.name !== undefined &&
          (await products.existsByName(product.name, id))
        ) {
          throw new AlreadyExistsException('El producto', product.name);
        }

        const previous = uploaded ? product.replaceImage(uploaded) : null;
        await products.save(product);
        return { product, previous };
      }),
    );

    // shortcut: si falla el borrado queda una imagen huérfana en el storage; limpiar a mano si llega a pasar.
    if (previous) await this.images.delete(previous.publicId).catch(() => {});
    return product;
  }

  // La imagen se conserva: el historial de compras puede seguir mostrándola.
  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.products.softDelete(id);
  }

  async findById(id: string): Promise<Product> {
    const product = await this.products.findById(id);
    if (!product) throw new ResourceNotFoundException('Producto', id);
    return product;
  }

  list(search?: string): Promise<Product[]> {
    return this.products.findAll(search?.trim() || undefined);
  }

  private async upload(image?: ImageFile): Promise<ProductImage | null> {
    return image ? this.images.upload(image) : null;
  }

  private async withImageRollback<T>(
    uploaded: ProductImage | null,
    work: () => Promise<T>,
  ): Promise<T> {
    try {
      return await work();
    } catch (error) {
      if (uploaded) await this.images.delete(uploaded.publicId).catch(() => {});
      throw error;
    }
  }
}
