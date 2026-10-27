import { User } from '../../../domain/model/user.model';

// Definido, sin implementar hasta integrar JWT
export abstract class TokenPort {
  // { sub, role }, 8 h
  abstract signAccessToken(user: User): Promise<string>;

  // { sub, role, pwdChange: true }, 10 min: solo sirve para /auth/first-login
  abstract signPasswordChangeToken(user: User): Promise<string>;
}
