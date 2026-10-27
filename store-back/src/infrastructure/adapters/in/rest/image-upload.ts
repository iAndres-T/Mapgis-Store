import { FileTypeValidator, ParseFilePipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageFile } from '@application/ports/out';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

// Multer rechaza con 413 los archivos de más de 2 MB antes de cargarlos completos en memoria
export const ImageInterceptor = FileInterceptor('image', {
  limits: { fileSize: MAX_IMAGE_BYTES },
});

// Valida el tipo real por magic numbers, no solo el mimetype que declara el cliente
export const imageFilePipe = new ParseFilePipe({
  fileIsRequired: false,
  validators: [new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ })],
});

export const toImageFile = (
  file?: Express.Multer.File,
): ImageFile | undefined =>
  file && { buffer: file.buffer, mimeType: file.mimetype };
