import { DomainException } from './domain.exception';

export class InvalidCredentialsException extends DomainException {
  constructor() {
    super('Usuario o contraseña incorrectos');
  }
}
