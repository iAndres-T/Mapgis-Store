import { DomainException } from './domain.exception';

export class AlreadyExistsException extends DomainException {
  constructor(resource: string, value: string) {
    super(`${resource} '${value}' ya existe`);
  }
}
