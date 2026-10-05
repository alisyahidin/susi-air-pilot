import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp } from '../../testing/create-test-app.js';
import { statusOf } from './flight-hours.service.js';

describe('statusOf', () => {
  it('is within below 80% of the limit, approaching from 80%, at_limit when equal, over beyond', () => {
    expect(statusOf(6.3, 8)).toBe('within');
    expect(statusOf(6.4, 8)).toBe('approaching'); // exactly 80%
    expect(statusOf(7.9, 8)).toBe('approaching');
    expect(statusOf(8, 8)).toBe('at_limit');
    expect(statusOf(8.1, 8)).toBe('over');
  });
});

describe('FlightHoursController (GET /api/v1/flight-hours/limits)', () => {
  let app: NestFastifyApplication;
  let accessToken: string;

  beforeAll(async () => {
    vi.stubEnv('TODAY', '2026-05-15');
    app = await createTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'johndoe', password: 'susiairtest' },
    });
    accessToken = res.json().accessToken;
  });

  afterAll(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  const limits = (query = '', token: string | null = accessToken) =>
    app.inject({
      method: 'GET',
      url: `/api/v1/flight-hours/limits${query}`,
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });

  it('sums each rolling window ending on the given date, against its limit', async () => {
    const res = await limits('?date=2026-05-15');

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      date: '2026-05-15',
      limits: [
        { period: 'daily', windowDays: 1, hours: 6.4, limit: 8, remaining: 1.6, status: 'approaching' },
        { period: 'weekly', windowDays: 7, hours: 25.2, limit: 40, remaining: 14.8, status: 'within' },
        { period: 'monthly', windowDays: 30, hours: 87.2, limit: 100, remaining: 12.8, status: 'approaching' },
        { period: 'annual', windowDays: 365, hours: 1013.8, limit: 1050, remaining: 36.2, status: 'approaching' },
      ],
    });
  });

  it('moves the windows with the date', async () => {
    const res = await limits('?date=2026-05-31');
    expect(res.json().limits.map((l: { hours: number }) => l.hours)).toEqual([4.3, 15.4, 99.3, 1025.3]);
  });

  it('counts days before the log starts as zero', async () => {
    const res = await limits('?date=2024-12-01');
    expect(res.json().limits.every((l: { hours: number, status: string }) => l.hours === 0 && l.status === 'within')).toBe(true);
  });

  it('defaults to TODAY from the environment without a date', async () => {
    const res = await limits();
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual((await limits('?date=2026-05-15')).json());
  });

  it('answers 400 for a malformed date', async () => {
    for (const bad of ['?date=15-05-2026', '?date=2026-02-30', '?date=today']) {
      const res = await limits(bad);
      expect(res.statusCode).toBe(400);
      expect(res.json().errors.date).toEqual(['Use a date like 2026-05-15.']);
    }
  });

  it('needs a valid access token', async () => {
    expect((await limits('?date=2026-05-15', null)).statusCode).toBe(401);
    expect((await limits('?date=2026-05-15', 'not.a.token')).statusCode).toBe(401);
  });
});
