import { BillingCycle } from '@domain/model';
import { BillingCycleResponse } from '@infrastructure/adapters/in/rest/dto';

export class BillingCycleMapper {
  static toResponse(cycle: BillingCycle): BillingCycleResponse {
    return {
      id: cycle.id,
      periodStart: cycle.periodStart,
      closedAt: cycle.closedAt,
      totalAmount: cycle.totalAmount,
    };
  }
}
