import { BillingCycleDetail } from './query-billing-cycles.use-case';

export abstract class CloseBillingCycleUseCase {
  abstract execute(adminId: string): Promise<BillingCycleDetail>;
}
