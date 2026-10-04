import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '@nestjs/authentication';
import { UsersRepository } from '../users/users.repository.js';
import { userSchema } from '../users/entities/user.entity.js';
import type { LoginDto } from './dto/login.dto.js';
import type { LoginResponseDto } from './dto/login-response.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly tokens: TokenService,
  ) {}

  async login({ username, password }: LoginDto): Promise<LoginResponseDto> {
    const user = await this.users.findByUsername(username);

    if (!user || !passwordMatches(password, user.password)) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const tokens = await this.tokens.issue(user.id, { method: 'password', claims: { amr: ['pwd'] } });
    return { ...tokens, user: userSchema.parse(user) };
  }
}

function passwordMatches(given: string, stored: string): boolean {
  return given === stored;
}
