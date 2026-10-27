import { Role } from '@domain/model';

export interface UserResponse {
  id: string;
  name: string;
  role: Role;
  phone: string | null;
  debt: number;
  mustChangePassword: boolean;
}
