import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, JwtBearerProvider, type JwtClaims } from '@nestjs/authentication';
import { UsersRepository } from '../users/users.repository.js';
import { userSchema, type User } from '../users/entities/user.entity.js';

declare module '@nestjs/authentication' {
  interface AuthenticationTypes {
    user: User;
  }
}

/** Authenticates `Authorization: Bearer <accessToken>` on every route that isn't @Public(). */
@Injectable()
export class JwtAuth extends JwtBearerProvider<User> {
  constructor(
    private readonly users: UsersRepository,
    registry: AuthenticationRegistry,
  ) {
    super(); // verifies tokens signed with AuthenticationModule's accessToken options
    registry.registerProvider(this);
  }

  protected async validate(claims: JwtClaims): Promise<User | null> {
    const user = claims.sub ? await this.users.findById(claims.sub) : null;
    return user ? userSchema.parse(user) : null;
  }
}
