import { ProductImage } from '@domain/model';

export interface ImageFile {
  buffer: Buffer;
  mimeType: string;
}

export abstract class ImageStoragePort {
  abstract upload(file: ImageFile): Promise<ProductImage>;

  abstract delete(publicId: string): Promise<void>;
}
