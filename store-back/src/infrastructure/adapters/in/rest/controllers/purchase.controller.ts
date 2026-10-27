import { Body, Controller, Post } from '@nestjs/common';
import { RegisterPurchaseUseCase } from '@application/ports/in';
import { Role } from '@domain/model';
import { PurchaseMapper } from '@infrastructure/mappers';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '@infrastructure/adapters/in/rest/decorators';
import {
  PurchaseResponse,
  RegisterPurchaseDto,
} from '@infrastructure/adapters/in/rest/dto';

@Controller('purchases')
export class PurchaseController {
  constructor(private readonly registerPurchase: RegisterPurchaseUseCase) {}

  @Post()
  @Roles(Role.CLIENT)
  async register(
    @CurrentUser() user: AuthUser,
    @Body() dto: RegisterPurchaseDto,
  ): Promise<PurchaseResponse> {
    const purchase = await this.registerPurchase.execute({
      userId: user.id,
      requestId: dto.requestId,
      paymentMethod: dto.paymentMethod,
      lines: dto.items,
    });
    return PurchaseMapper.toResponse(purchase);
  }
}
