// Definido, sin implementar hasta integrar JWT

export interface LoginOption {
  id: string;
  name: string;
}

export interface LoginResult {
  token: string;
  requiresPasswordChange: boolean;
}

export abstract class AuthenticateUseCase {
  abstract listLoginOptions(): Promise<LoginOption[]>;

  abstract login(userId: string, password: string): Promise<LoginResult>;

  abstract completeFirstLogin(
    userId: string,
    newPassword: string,
    phone: string,
  ): Promise<string>;
}
