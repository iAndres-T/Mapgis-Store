import { Controller, Get } from '@nestjs/common';
import { QueryMyAccountUseCase } from '@application/ports/in';
import { PurchaseSummary } from '@application/ports/out';
import { Role } from '@domain/model';
import { UserMapper } from '@infrastructure/mappers';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '@infrastructure/adapters/in/rest/decorators';
import { UserResponse } from '@infrastructure/adapters/in/rest/dto';

@Controller('me')
@Roles(Role.CLIENT)
export class MeController {
  constructor(private readonly myAccount: QueryMyAccountUseCase) {}

  @Get()
  async getProfile(@CurrentUser() user: AuthUser): Promise<UserResponse> {
    return UserMapper.toResponse(await this.myAccount.getProfile(user.id));
  }

  @Get('purchases')
  listPurchases(@CurrentUser() user: AuthUser): Promise<PurchaseSummary[]> {
    return this.myAccount.listPurchases(user.id);
  }
}
