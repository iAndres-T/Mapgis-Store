import { ResourceNotFoundException } from '@domain/exception';
import { BillingCycle } from '@domain/model';
import {
  BillingCycleDetail,
  QueryBillingCyclesUseCase,
} from '@application/ports/in';
import {
  BillingRepositoryPort,
  PaymentReminderPort,
} from '@application/ports/out';

export class QueryBillingCyclesService extends QueryBillingCyclesUseCase {
  constructor(
    private readonly billing: BillingRepositoryPort,
    private readonly reminders: PaymentReminderPort,
  ) {
    super();
  }

  list(): Promise<BillingCycle[]> {
    return this.billing.findAll();
  }

  // Los links usan charges.amount (no users.debt, que ya está en 0) para poder regenerarlos después.
  async getDetail(id: string): Promise<BillingCycleDetail> {
    const cycle = await this.billing.findById(id);
    if (!cycle) throw new ResourceNotFoundException('Ciclo de cobro', id);

    const recipients = await this.billing.findChargeRecipients(id);
    return {
      id: cycle.id,
      periodStart: cycle.periodStart,
      closedAt: cycle.closedAt,
      totalAmount: cycle.totalAmount,
      notices: recipients.map((r) => ({
        chargeId: r.chargeId,
        userId: r.userId,
        userName: r.userName,
        amount: r.amount,
        whatsappLink: r.phone
          ? this.reminders.buildLink({
              name: r.userName,
              phone: r.phone,
              amount: r.amount,
              periodStart: cycle.periodStart,
              closedAt: cycle.closedAt,
            })
          : null,
      })),
    };
  }
}
