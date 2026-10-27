import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  BillingCycleDetail,
  CloseBillingCycleUseCase,
  QueryBillingCyclesUseCase,
} from '@application/ports/in';
import { Role } from '@domain/model';
import { BillingCycleMapper } from '@infrastructure/mappers';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '@infrastructure/adapters/in/rest/decorators';
import { BillingCycleResponse } from '@infrastructure/adapters/in/rest/dto';

@Controller('billing-cycles')
@Roles(Role.ADMIN)
export class BillingCycleController {
  constructor(
    private readonly closeBillingCycle: CloseBillingCycleUseCase,
    private readonly billingCycles: QueryBillingCyclesUseCase,
  ) {}

  @Post()
  close(@CurrentUser() admin: AuthUser): Promise<BillingCycleDetail> {
    return this.closeBillingCycle.execute(admin.id);
  }

  @Get()
  async list(): Promise<BillingCycleResponse[]> {
    const cycles = await this.billingCycles.list();
    return cycles.map((cycle) => BillingCycleMapper.toResponse(cycle));
  }

  @Get(':id')
  getDetail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BillingCycleDetail> {
    return this.billingCycles.getDetail(id);
  }
}
