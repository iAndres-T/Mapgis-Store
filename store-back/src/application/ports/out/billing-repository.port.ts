import { BillingCycle } from '../../../domain/model/billing-cycle.model';

// Modelo de lectura para regenerar los links de WhatsApp de un ciclo ya cerrado
export interface ChargeRecipient {
  chargeId: string;
  userId: string;
  userName: string;
  phone: string | null;
  amount: number;
}

export abstract class BillingRepositoryPort {

  abstract lockForClosing(): Promise<void>;

  abstract findLastClosedAt(): Promise<Date | null>;

  abstract save(cycle: BillingCycle): Promise<void>;

  abstract findById(id: string): Promise<BillingCycle | null>;

  abstract findAll(): Promise<BillingCycle[]>;

  abstract findChargeRecipients(cycleId: string): Promise<ChargeRecipient[]>;
}
