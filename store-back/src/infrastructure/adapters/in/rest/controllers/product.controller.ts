import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ManageProductsUseCase } from '@application/ports/in';
import { Role } from '@domain/model';
import { ProductMapper } from '@infrastructure/mappers';
import { Roles } from '@infrastructure/adapters/in/rest/decorators';
import {
  CreateProductDto,
  ProductResponse,
  UpdateProductDto,
} from '@infrastructure/adapters/in/rest/dto';
import {
  imageFilePipe,
  ImageInterceptor,
  toImageFile,
} from '@infrastructure/adapters/in/rest/image-upload';

@Controller('products')
export class ProductController {
  constructor(private readonly products: ManageProductsUseCase) {}

  @Post()
  @Roles(Role.ADMIN)
  @UseInterceptors(ImageInterceptor)
  async create(
    @Body() dto: CreateProductDto,
    @UploadedFile(imageFilePipe) file?: Express.Multer.File,
  ): Promise<ProductResponse> {
    const product = await this.products.create({
      ...dto,
      image: toImageFile(file),
    });
    return ProductMapper.toResponse(product);
  }

  @Get()
  async list(@Query('search') search?: string): Promise<ProductResponse[]> {
    const products = await this.products.list(search);
    return products.map((product) => ProductMapper.toResponse(product));
  }

  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductResponse> {
    return ProductMapper.toResponse(await this.products.findById(id));
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @UseInterceptors(ImageInterceptor)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFile(imageFilePipe) file?: Express.Multer.File,
  ): Promise<ProductResponse> {
    const product = await this.products.update(id, {
      ...dto,
      image: toImageFile(file),
    });
    return ProductMapper.toResponse(product);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.products.delete(id);
  }
}
