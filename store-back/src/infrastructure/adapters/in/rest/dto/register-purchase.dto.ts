import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@domain/model';

export class PurchaseLineDto {
  @IsUUID('4')
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class RegisterPurchaseDto {
  @IsUUID('4')
  requestId!: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineDto)
  items!: PurchaseLineDto[];
}
