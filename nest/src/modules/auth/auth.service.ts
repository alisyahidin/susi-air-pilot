import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthenticationError, JwtVerifier, TokenService, type TokenPair } from '@nestjs/authentication';
import { authConfig, type AuthConfig } from '../../config/index.js';
import { UsersRepository } from '../users/users.repository.js';
import { userSchema, type User } from '../users/entities/user.entity.js';
import type { LoginDto } from './dto/login.dto.js';

export interface IssuedSession extends TokenPair {
  user: User;
}

@Injectable()
export class AuthService {
  private readonly verifier: JwtVerifier;

  constructor(
    private readonly users: UsersRepository,
    private readonly tokens: TokenService,
    @Inject(authConfig.KEY) auth: AuthConfig,
  ) {
    this.verifier = new JwtVerifier({ key: auth.accessToken.secret, issuer: auth.accessToken.issuer });
  }

  async login({ username, password }: LoginDto): Promise<IssuedSession> {
    const user = await this.users.findByUsername(username);

    if (!user || !passwordMatches(password, user.password)) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const pair = await this.tokens.issue(user.id, { method: 'password', claims: { amr: ['pwd'] } });
    return { ...pair, user: userSchema.parse(user) };
  }

  async refresh(refreshToken: string): Promise<IssuedSession> {
    const pair = await this.tokens.refresh(refreshToken);
    const { sub } = await this.verifier.verify(pair.accessToken);
    const user = sub ? await this.users.findById(sub) : null;
    if (!user) {
      await this.tokens.revoke(pair.refreshToken);
      throw new AuthenticationError('Unknown user');
    }
    return { ...pair, user: userSchema.parse(user) };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokens.revoke(refreshToken);
  }
}

function passwordMatches(given: string, stored: string): boolean {
  return given === stored;
}
