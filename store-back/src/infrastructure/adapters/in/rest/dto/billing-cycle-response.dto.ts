
export interface BillingCycleResponse {
  id: string;
  periodStart: Date | null;
  closedAt: Date;
  totalAmount: number;
}
