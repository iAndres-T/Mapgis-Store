import { randomUUID } from 'node:crypto';
import { BusinessRuleException } from '@domain/exception';
import { User } from './user.model';

export interface ChargeProps {
  id: string;
  billingCycleId: string;
  userId: string;
  amount: number;
}

/** Snapshot de lo cobrado a un cliente: users.debt queda en 0 tras el cierre. */
export class Charge {
  readonly id: string;
  readonly billingCycleId: string;
  readonly userId: string;
  readonly amount: number;

  private constructor(props: ChargeProps) {
    this.id = props.id;
    this.billingCycleId = props.billingCycleId;
    this.userId = props.userId;
    this.amount = props.amount;
  }

  static restore(props: ChargeProps): Charge {
    return new Charge(props);
  }

  static forDebtor(billingCycleId: string, debtor: User): Charge {
    return new Charge({
      id: randomUUID(),
      billingCycleId,
      userId: debtor.id,
      amount: debtor.debt,
    });
  }
}

export interface BillingCycleProps {
  id: string;
  periodStart: Date | null;
  closedAt: Date;
  closedById: string;
  totalAmount: number;
  charges: Charge[];
}

export interface CloseBillingCycle {
  closedById: string;
  previousClosedAt: Date | null;
  debtors: User[];
  now: Date;
}

export class BillingCycle {
  readonly id: string;
  readonly periodStart: Date | null;
  readonly closedAt: Date;
  readonly closedById: string;
  readonly totalAmount: number;
  readonly charges: readonly Charge[];

  private constructor(props: BillingCycleProps) {
    this.id = props.id;
    this.periodStart = props.periodStart;
    this.closedAt = props.closedAt;
    this.closedById = props.closedById;
    this.totalAmount = props.totalAmount;
    this.charges = props.charges;
  }

  static close(data: CloseBillingCycle): BillingCycle {
    const id = randomUUID();
    const charges = data.debtors
      .filter((debtor) => debtor.debt > 0)
      .map((debtor) => Charge.forDebtor(id, debtor));

    if (charges.length === 0) {
      throw new BusinessRuleException('No hay saldos pendientes por cobrar');
    }

    return new BillingCycle({
      id,
      periodStart: data.previousClosedAt,
      closedAt: data.now,
      closedById: data.closedById,
      totalAmount: charges.reduce((sum, charge) => sum + charge.amount, 0),
      charges,
    });
  }

  // charges puede venir vacío cuando solo se consulta el encabezado del ciclo.
  static restore(props: BillingCycleProps): BillingCycle {
    return new BillingCycle(props);
  }
}
