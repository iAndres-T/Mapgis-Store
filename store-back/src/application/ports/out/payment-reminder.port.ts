export interface PaymentReminder {
  name: string;
  phone: string;
  amount: number;
  periodStart: Date | null;
  closedAt: Date;
}

export abstract class PaymentReminderPort {
  // Devuelve el link https://wa.me/<phone>?text=<mensaje>
  abstract buildLink(reminder: PaymentReminder): string;
}
