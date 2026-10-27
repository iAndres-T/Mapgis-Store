import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Role } from '@domain/model';
import { AuthenticatedRequest } from '@infrastructure/adapters/in/rest/decorators';

// TEMPORAL: identifica al usuario por headers mientras se integra JWT. Se reemplaza por JwtAuthGuard.
@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const id = request.header('x-user-id');
    const role = request.header('x-user-role') ?? Role.CLIENT;

    if (!id || !isUUID(id) || !Object.values<string>(Role).includes(role)) {
      throw new UnauthorizedException(
        'Envía los headers x-user-id (uuid) y x-user-role (ADMIN | CLIENT)',
      );
    }

    request.user = { id, role: role as Role };
    return true;
  }
}
