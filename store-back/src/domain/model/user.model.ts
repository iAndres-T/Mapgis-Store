import { randomUUID } from 'node:crypto';
import { BusinessRuleException } from '../exception/business-rule.exception';
import { Phone } from './phone.model';
import { Role } from './role.enum';

export interface UserProps {
  id: string;
  name: string;
  role: Role;
  passwordHash: string;
  mustChangePassword: boolean;
  phone: string | null;
  debt: number;
}

export class User {
  static readonly DEFAULT_PASSWORD = '12345*';
  static readonly MIN_PASSWORD_LENGTH = 6;
  static readonly MAX_NAME_LENGTH = 120;

  private constructor(private readonly props: UserProps) {}

  /** El hash debe corresponder a DEFAULT_PASSWORD */
  static create(name: string, role: Role, defaultPasswordHash: string): User {
    return new User({
      id: randomUUID(),
      name: User.validateName(name),
      role,
      passwordHash: defaultPasswordHash,
      mustChangePassword: true,
      phone: null,
      debt: 0,
    });
  }

  static restore(props: UserProps): User {
    return new User({ ...props });
  }

  /** Se valida la contraseña en texto plano, antes de hashearla. */
  static validateNewPassword(password: string): void {
    if (password.length < User.MIN_PASSWORD_LENGTH) {
      throw new BusinessRuleException(
        `La contraseña debe tener al menos ${User.MIN_PASSWORD_LENGTH} caracteres`,
      );
    }
    if (password === User.DEFAULT_PASSWORD) {
      throw new BusinessRuleException(
        'La nueva contraseña no puede ser la contraseña por defecto',
      );
    }
  }

  private static validateName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed.length > User.MAX_NAME_LENGTH) {
      throw new BusinessRuleException(
        `El nombre es obligatorio y debe tener máximo ${User.MAX_NAME_LENGTH} caracteres`,
      );
    }
    return trimmed;
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get role(): Role {
    return this.props.role;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get mustChangePassword(): boolean {
    return this.props.mustChangePassword;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get debt(): number {
    return this.props.debt;
  }

  isAdmin(): boolean {
    return this.props.role === Role.ADMIN;
  }

  rename(name: string): void {
    this.props.name = User.validateName(name);
  }

  resetPassword(defaultPasswordHash: string): void {
    this.props.passwordHash = defaultPasswordHash;
    this.props.mustChangePassword = true;
  }

  completeFirstLogin(newPasswordHash: string, phone: Phone): void {
    if (!this.props.mustChangePassword) {
      throw new BusinessRuleException(
        'El usuario ya completó su primer inicio de sesión',
      );
    }
    this.props.passwordHash = newPasswordHash;
    this.props.phone = phone.value;
    this.props.mustChangePassword = false;
  }

  ensureCanBeDeleted(): void {
    if (this.props.debt > 0) {
      throw new BusinessRuleException(
        `No se puede eliminar a '${this.props.name}' porque tiene un saldo pendiente`,
      );
    }
  }
}
