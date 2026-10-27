import { ProductImage } from '../../../domain/model/product.model';

export interface ImageFile {
  buffer: Buffer;
  mimeType: string;
}

export abstract class ImageStoragePort {
  abstract upload(file: ImageFile): Promise<ProductImage>;

  abstract delete(publicId: string): Promise<void>;
}
