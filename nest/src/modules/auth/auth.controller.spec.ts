import { Controller, Get, VersioningType } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../app.module.js';
import type { User } from '../users/entities/user.entity.js';

// Test-only route without @Public(), to check the issued access token passes the global guard
@Controller('test-protected')
class ProtectedController {
  @Get()
  me(@CurrentUser() user: User) {
    return user;
  }
}

describe('AuthController (POST /api/v1/auth/login)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ProtectedController],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(() => app.close());

  const login = (payload: unknown) =>
    app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: payload as object });

  it('returns tokens and the user, without the password, for valid credentials', async () => {
    const res = await login({ username: 'johndoe', password: 'susiairtest' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.accessToken.split('.')).toHaveLength(3); // a JWT
    expect(body.refreshToken).toEqual(expect.any(String));
    expect(body.expiresIn).toBe(15 * 60);
    expect(body.user).toEqual({
      id: '67b0ec9a-1786-46b9-9ee1-531297fb9e41',
      name: 'John Doe',
      username: 'johndoe',
      image_url: 'https://i.pravatar.cc/120?u=johndoe',
    });
  });

  it('trims the username', async () => {
    const res = await login({ username: '  udin ', password: 'susiairtest' });
    expect(res.statusCode).toBe(200);
    expect(res.json().user.username).toBe('udin');
  });

  it('gives the same 401 for a wrong password and an unknown user', async () => {
    const wrongPassword = await login({ username: 'johndoe', password: 'nope' });
    const unknownUser = await login({ username: 'nobody', password: 'susiairtest' });

    expect(wrongPassword.statusCode).toBe(401);
    expect(unknownUser.statusCode).toBe(401);
    expect(wrongPassword.json().message).toBe('Invalid username or password');
    expect(unknownUser.json().message).toBe(wrongPassword.json().message);
  });

  it('answers 400 with field errors for missing credentials', async () => {
    const res = await login({ username: ' ' });

    expect(res.statusCode).toBe(400);
    expect(res.json().errors).toEqual({
      username: ['Enter your username.'],
      password: ['Enter your password.'],
    });
  });

  it('issues an access token that authenticates protected routes', async () => {
    const { accessToken } = (await login({ username: 'johndoe', password: 'susiairtest' })).json();

    const anonymous = await app.inject({ method: 'GET', url: '/api/v1/test-protected' });
    const authed = await app.inject({
      method: 'GET',
      url: '/api/v1/test-protected',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const tampered = await app.inject({
      method: 'GET',
      url: '/api/v1/test-protected',
      headers: { authorization: `Bearer ${accessToken.slice(0, -2)}xx` },
    });

    expect(anonymous.statusCode).toBe(401);
    expect(authed.statusCode).toBe(200);
    expect(authed.json().username).toBe('johndoe');
    expect(tampered.statusCode).toBe(401);
  });
});
