import { DomainException } from './domain.exception';

export class BillingTooSoonException extends DomainException {
  constructor(minDays: number, nextAvailableAt: Date) {
    const date = nextAvailableAt.toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'long',
    });
    super(
      `Deben pasar al menos ${minDays} días entre cobros. El próximo cobro se puede hacer a partir del ${date}`,
    );
  }
}
