import { BillingTooSoonException } from '@domain/exception';

const DAY_MS = 86_400_000;

// Día calendario en Bogotá (YYYY-MM-DD → medianoche UTC)
const bogotaDay = (date: Date): number =>
  Date.parse(date.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }));

export class BillingPolicy {
  static readonly MIN_DAYS_BETWEEN_CHARGES = 10;

  // El primer cierre (sin ciclo anterior) se permite.
  static ensureCanClose(lastClosedAt: Date | null, now: Date): void {
    if (!lastClosedAt) return;

    const elapsedDays = (bogotaDay(now) - bogotaDay(lastClosedAt)) / DAY_MS;
    if (elapsedDays < BillingPolicy.MIN_DAYS_BETWEEN_CHARGES) {
      throw new BillingTooSoonException(
        BillingPolicy.MIN_DAYS_BETWEEN_CHARGES,
        new Date(
          lastClosedAt.getTime() +
            BillingPolicy.MIN_DAYS_BETWEEN_CHARGES * DAY_MS,
        ),
      );
    }
  }
}
