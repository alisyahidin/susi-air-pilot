import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp } from '../../testing/create-test-app.js';

describe('Swagger', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(() => app.close());

  const get = (url: string) => app.inject({ method: 'GET', url });

  it('redirects the home page to /docs', async () => {
    const res = await get('/');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/docs');
  });

  it('serves Swagger UI at /docs without signing in', async () => {
    const res = await get('/docs');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
  });

  it('documents every route with its zod schemas, and bearer auth on protected ones', async () => {
    const { paths, components } = (await get('/docs-json')).json();

    expect(Object.keys(paths).sort()).toEqual([
      '/api/v1/auth/login',
      '/api/v1/auth/logout',
      '/api/v1/auth/refresh',
      '/api/v1/documents',
      '/api/v1/flight-hours',
      '/api/v1/flight-hours/limits',
      '/api/v1/flight-hours/summary',
      '/api/v1/pilot/me',
      '/api/v1/schedules',
    ]);
    expect(components.securitySchemes.bearer).toMatchObject({ type: 'http', scheme: 'bearer' });

    for (const [path, operations] of Object.entries<Record<string, { security?: unknown }>>(paths)) {
      const { security } = Object.values(operations)[0]!;
      expect(security, path).toEqual(path.startsWith('/api/v1/auth/') ? undefined : [{ bearer: [] }]);
    }

    const login = paths['/api/v1/auth/login'].post;
    expect(login.requestBody.content['application/json'].schema.required).toEqual(['username', 'password']);

    const flightHours = paths['/api/v1/flight-hours'].get;
    expect(flightHours.parameters.map((p: { name: string }) => p.name)).toEqual(['from', 'to']);
    expect(flightHours.responses['200'].content['application/json'].schema).toMatchObject({
      type: 'array',
      items: { type: 'object', required: ['date', 'hours'] },
    });
  });
});
