import { DomainException } from './domain.exception';

export class ResourceNotFoundException extends DomainException {
  constructor(resource: string, id: string) {
    super(`${resource} con id '${id}' no existe`);
  }
}
