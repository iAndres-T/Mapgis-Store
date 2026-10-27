import { BillingCycle } from '@domain/model';

export interface ChargeNotice {
  chargeId: string;
  userId: string;
  userName: string;
  amount: number;
  whatsappLink: string | null;
}

export interface BillingCycleDetail {
  id: string;
  periodStart: Date | null;
  closedAt: Date;
  totalAmount: number;
  notices: ChargeNotice[];
}

export abstract class QueryBillingCyclesUseCase {
  abstract list(): Promise<BillingCycle[]>;

  abstract getDetail(id: string): Promise<BillingCycleDetail>;
}
