import { BillingCycle } from '@domain/model';
import { BillingPolicy } from '@domain/service';
import {
  BillingCycleDetail,
  CloseBillingCycleUseCase,
  QueryBillingCyclesUseCase,
} from '@application/ports/in';
import { UnitOfWorkPort } from '@application/ports/out';

export class CloseBillingCycleService extends CloseBillingCycleUseCase {
  constructor(
    private readonly uow: UnitOfWorkPort,
    private readonly cycles: QueryBillingCyclesUseCase,
  ) {
    super();
  }

  async execute(adminId: string): Promise<BillingCycleDetail> {
    const cycle = await this.uow.run(async ({ users, purchases, billing }) => {
      await billing.lockForClosing();

      // Se toma después del lock para que un cierre concurrente vea el closed_at del anterior.
      const now = new Date();
      const previousClosedAt = await billing.findLastClosedAt();
      BillingPolicy.ensureCanClose(previousClosedAt, now);

      const cycle = BillingCycle.close({
        closedById: adminId,
        previousClosedAt,
        debtors: await users.findDebtorsForUpdate(),
        now,
      });
      await billing.save(cycle);

      for (const charge of cycle.charges) {
        await purchases.settlePending(charge.userId, charge.id);
      }
      await users.resetDebt(cycle.charges.map((charge) => charge.userId));
      return cycle;
    });

    return this.cycles.getDetail(cycle.id);
  }
}
