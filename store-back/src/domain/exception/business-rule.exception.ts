import { DomainException } from './domain.exception';

export class BusinessRuleException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
