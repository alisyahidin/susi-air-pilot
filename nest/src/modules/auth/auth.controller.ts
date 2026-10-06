import { Body, Controller, HttpCode, HttpStatus, Inject, Post, Req, Res, SerializeOptions } from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse } from '@nestjs/swagger';
import { AuthenticationError, Public } from '@nestjs/authentication';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { appConfig, authConfig, type AppConfig, type AuthConfig } from '../../config/index.js';
import { REFRESH_TOKEN_COOKIE, durationToSeconds, refreshTokenCookieOptions } from './auth-cookie.js';
import { AuthService, type IssuedSession } from './auth.service.js';
import { loginSchema, type LoginDto } from './dto/login.dto.js';
import { sessionResponseSchema, type SessionResponseDto } from './dto/login-response.dto.js';

@Public()
@Controller('auth')
export class AuthController {
  private readonly cookieOptions: ReturnType<typeof refreshTokenCookieOptions>;
  private readonly cookieMaxAge: number;

  constructor(
    private readonly auth: AuthService,
    @Inject(appConfig.KEY) app: AppConfig,
    @Inject(authConfig.KEY) authOptions: AuthConfig,
  ) {
    this.cookieOptions = refreshTokenCookieOptions(app.nodeEnv === 'production');
    this.cookieMaxAge = durationToSeconds(authOptions.refreshToken.ttl);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ schema: sessionResponseSchema })
  @ApiOkResponse({ standardSchema: sessionResponseSchema })
  async login(
    @Body({ schema: loginSchema }) body: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<SessionResponseDto> {
    return this.startSession(reply, await this.auth.login(body));
  }

  /** Exchanges the refresh token cookie for a new access token, and rotates the cookie. */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ schema: sessionResponseSchema })
  @ApiOkResponse({ standardSchema: sessionResponseSchema })
  async refresh(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<SessionResponseDto> {
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) throw new AuthenticationError('Not signed in');

    try {
      return this.startSession(reply, await this.auth.refresh(refreshToken));
    } catch (error) {
      // Invalid, expired or reused: drop the dead cookie so the browser stops sending it
      reply.clearCookie(REFRESH_TOKEN_COOKIE, this.cookieOptions);
      throw error;
    }
  }

  @Post('logout')
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<void> {
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE];
    if (refreshToken) await this.auth.logout(refreshToken);
    reply.clearCookie(REFRESH_TOKEN_COOKIE, this.cookieOptions);
  }

  private startSession(reply: FastifyReply, { accessToken, refreshToken, expiresIn, user }: IssuedSession): SessionResponseDto {
    reply.setCookie(REFRESH_TOKEN_COOKIE, refreshToken, { ...this.cookieOptions, maxAge: this.cookieMaxAge });
    return { accessToken, expiresIn, user };
  }
}
