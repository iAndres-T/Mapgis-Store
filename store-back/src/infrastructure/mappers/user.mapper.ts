import { User } from '@domain/model';
import { UserResponse } from '@infrastructure/adapters/in/rest/dto';

export class UserMapper {
  static toResponse(user: User): UserResponse {
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      phone: user.phone,
      debt: user.debt,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
