import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp } from '../src/testing/create-test-app.js';

// Smoke test of the whole app over HTTP: it boots with the real modules and setup,
// protected routes need a token, and input is validated. Features are covered by
// the specs next to each module in src/.
describe('App (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(() => app.close());

  it('protects every feature route behind authentication', async () => {
    for (const url of ['/api/v1/pilot/me', '/api/v1/documents', '/api/v1/flight-hours/limits', '/api/v1/schedules']) {
      const res = await app.inject({ method: 'GET', url });
      expect(res.statusCode, url).toBe(401);
    }
  });

  it('validates sign-in input', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: {} });
    expect(res.statusCode).toBe(400);
    expect(Object.keys(res.json().errors)).toEqual(['username', 'password']);
  });

  it('answers 404 for unknown routes', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/v1/nope' })).statusCode).toBe(404);
  });
});
