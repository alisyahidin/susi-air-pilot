import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp } from '../../testing/create-test-app.js';
import type { User } from '../users/entities/user.entity.js';
import { REFRESH_TOKEN_COOKIE } from './auth-cookie.js';

// Test-only route without @Public(), to check the access token passes the global guard
@Controller('test-protected')
class ProtectedController {
  @Get()
  me(@CurrentUser() user: User) {
    return user;
  }
}

const NUXT_ORIGIN = 'http://localhost:3000'; // the CORS_ORIGIN default

describe('AuthController', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp([ProtectedController]);
  });

  afterAll(() => app.close());

  const login = (payload: unknown, headers: Record<string, string> = {}) =>
    app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: payload as object, headers });

  const post = (url: string, headers: Record<string, string> = {}) =>
    app.inject({ method: 'POST', url: `/api/v1/auth/${url}`, headers });

  /** The refresh cookie a response set, as "name=value" ready to send back. */
  const refreshCookieOf = (res: Awaited<ReturnType<typeof login>>) => {
    const cookie = res.cookies.find(c => c.name === REFRESH_TOKEN_COOKIE);
    return cookie ? `${cookie.name}=${cookie.value}` : undefined;
  };

  const signIn = async () => {
    const res = await login({ username: 'johndoe', password: 'susiairtest' });
    return { accessToken: res.json().accessToken as string, cookie: refreshCookieOf(res)! };
  };

  const getProtected = (accessToken?: string) =>
    app.inject({
      method: 'GET',
      url: '/api/v1/test-protected',
      headers: accessToken ? { authorization: `Bearer ${accessToken}` } : {},
    });

  describe('POST /auth/login', () => {
    it('returns the access token and user, and sets the refresh token only as an httpOnly cookie', async () => {
      const res = await login({ username: 'johndoe', password: 'susiairtest' });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.accessToken.split('.')).toHaveLength(3); // a JWT
      expect(body.expiresIn).toBe(15 * 60);
      expect(body.user).toEqual({
        id: '67b0ec9a-1786-46b9-9ee1-531297fb9e41',
        name: 'John Doe',
        username: 'johndoe',
        image_url: 'https://i.pravatar.cc/120?u=johndoe',
      });
      expect(body).not.toHaveProperty('refreshToken');

      const cookie = res.cookies.find(c => c.name === REFRESH_TOKEN_COOKIE);
      expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Strict', path: '/api/v1/auth', maxAge: 30 * 86400 });
      expect(res.body).not.toContain(cookie!.value);
    });

    it('trims the username', async () => {
      const res = await login({ username: '  udin ', password: 'susiairtest' });
      expect(res.statusCode).toBe(200);
      expect(res.json().user.username).toBe('udin');
    });

    it('gives the same 401 for a wrong password and an unknown user, and sets no cookie', async () => {
      const wrongPassword = await login({ username: 'johndoe', password: 'nope' });
      const unknownUser = await login({ username: 'nobody', password: 'susiairtest' });

      expect(wrongPassword.statusCode).toBe(401);
      expect(unknownUser.statusCode).toBe(401);
      expect(wrongPassword.json().message).toBe('Invalid username or password');
      expect(unknownUser.json().message).toBe(wrongPassword.json().message);
      expect(wrongPassword.cookies).toHaveLength(0);
    });

    it('answers 400 with field errors for missing credentials', async () => {
      const res = await login({ username: ' ' });

      expect(res.statusCode).toBe(400);
      expect(res.json().errors).toEqual({
        username: ['Enter your username.'],
        password: ['Enter your password.'],
      });
    });
  });

  describe('the access token', () => {
    it('authenticates protected routes as a Bearer header; missing or tampered is a 401', async () => {
      const { accessToken } = await signIn();

      expect((await getProtected()).statusCode).toBe(401);
      const authed = await getProtected(accessToken);
      expect(authed.statusCode).toBe(200);
      expect(authed.json().username).toBe('johndoe');
      expect((await getProtected(`${accessToken.slice(0, -2)}xx`)).statusCode).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('exchanges the refresh cookie for a new access token and rotates the cookie', async () => {
      const { cookie } = await signIn();

      const res = await post('refresh', { cookie });
      expect(res.statusCode).toBe(200);
      expect(res.json().user.username).toBe('johndoe');
      expect((await getProtected(res.json().accessToken)).statusCode).toBe(200);

      const rotated = refreshCookieOf(res);
      expect(rotated).toBeDefined();
      expect(rotated).not.toBe(cookie);
    });

    it('treats a reused refresh token as theft: 401, and the whole session is revoked', async () => {
      const { cookie } = await signIn();
      const rotated = refreshCookieOf(await post('refresh', { cookie }))!;

      const reused = await post('refresh', { cookie });
      expect(reused.statusCode).toBe(401);
      expect(reused.cookies.find(c => c.name === REFRESH_TOKEN_COOKIE)?.value).toBe(''); // cleared

      expect((await post('refresh', { cookie: rotated })).statusCode).toBe(401);
    });

    it('answers 401 without a refresh cookie', async () => {
      expect((await post('refresh')).statusCode).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('revokes the refresh token and clears the cookie', async () => {
      const { cookie } = await signIn();

      const res = await post('logout', { cookie });
      expect(res.statusCode).toBe(204);
      expect(res.cookies.find(c => c.name === REFRESH_TOKEN_COOKIE)).toMatchObject({ value: '', path: '/api/v1/auth' });

      expect((await post('refresh', { cookie })).statusCode).toBe(401);
    });

    it('still clears the cookie without a session', async () => {
      expect((await post('logout')).statusCode).toBe(204);
    });
  });

  describe('CSRF: Origin check on the cookie endpoints', () => {
    it('refuses refresh, logout and login from another origin', async () => {
      const { cookie } = await signIn();
      const evil = { origin: 'https://evil.example' };

      expect((await post('refresh', { cookie, ...evil })).statusCode).toBe(403);
      expect((await post('logout', { cookie, ...evil })).statusCode).toBe(403);
      expect((await login({ username: 'johndoe', password: 'susiairtest' }, evil)).statusCode).toBe(403);
      expect((await post('refresh', { cookie, referer: 'https://evil.example/page' })).statusCode).toBe(403);

      // The refused refresh didn't spend the token
      expect((await post('refresh', { cookie, origin: NUXT_ORIGIN })).statusCode).toBe(200);
    });
  });

  describe('CORS', () => {
    it('allows credentials and the Authorization header for the Nuxt origin only', async () => {
      const preflight = (origin: string) =>
        app.inject({
          method: 'OPTIONS',
          url: '/api/v1/auth/refresh',
          headers: { origin, 'access-control-request-method': 'POST', 'access-control-request-headers': 'authorization' },
        });

      const nuxt = await preflight(NUXT_ORIGIN);
      expect(nuxt.headers['access-control-allow-origin']).toBe(NUXT_ORIGIN);
      expect(nuxt.headers['access-control-allow-credentials']).toBe('true');
      expect(String(nuxt.headers['access-control-allow-headers'])).toContain('Authorization');

      expect((await preflight('https://evil.example')).headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
