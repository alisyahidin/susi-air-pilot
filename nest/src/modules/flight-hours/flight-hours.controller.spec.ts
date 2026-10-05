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

describe('FlightHoursController (GET /api/v1/flight-hours/summary)', () => {
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

  const summary = (query = '', token: string | null = accessToken) =>
    app.inject({
      method: 'GET',
      url: `/api/v1/flight-hours/summary${query}`,
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });

  it('returns the rolling totals on the 15 days centred on TODAY, for 1w by default', async () => {
    const res = await summary();

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({
      date: '2026-05-15',
      range: '1w',
      windowDays: 7,
      limit: 40,
      max: 45,
      today: { hours: 25.2, remaining: 14.8, status: 'within' },
    });
    expect(body.points).toHaveLength(15);
    expect(body.points[0].date).toBe('2026-05-08');
    expect(body.points[7]).toEqual({ date: '2026-05-15', hours: 25.2, status: 'within', projected: false });
    expect(body.points[14].date).toBe('2026-05-22');
    expect(body.points.map((p: { hours: number }) => p.hours)).toEqual(
      [15, 15, 16.6, 12.6, 16.3, 22.2, 24, 25.2, 31.4, 36.4, 42.8, 44, 44.7, 42.7, 36.3],
    );
  });

  it('marks days after the date as projected, and points over the limit as over', async () => {
    const { points } = (await summary()).json();
    expect(points.filter((p: { projected: boolean }) => p.projected).map((p: { date: string }) => p.date))
      .toEqual(['2026-05-16', '2026-05-17', '2026-05-18', '2026-05-19', '2026-05-20', '2026-05-21', '2026-05-22']);
    expect(points.filter((p: { status: string }) => p.status === 'over').map((p: { hours: number }) => p.hours))
      .toEqual([42.8, 44, 44.7, 42.7]);
  });

  it('uses each range\'s window, limit and axis max', async () => {
    const month = (await summary('?range=1m')).json();
    expect(month).toMatchObject({ range: '1m', windowDays: 30, limit: 100, max: 125, today: { hours: 87.2, status: 'approaching' } });

    const year = (await summary('?range=1y')).json();
    expect(year).toMatchObject({ range: '1y', windowDays: 365, limit: 1050, max: 1200, today: { hours: 1013.8 } });
  });

  it('centres on the date when one is given', async () => {
    const res = (await summary('?range=1w&date=2026-05-31')).json();
    expect(res.date).toBe('2026-05-31');
    expect(res.points[7].date).toBe('2026-05-31');
  });

  it('answers 400 for an unknown range or a malformed date', async () => {
    expect((await summary('?range=2w')).statusCode).toBe(400);
    const badDate = await summary('?date=15-05-2026');
    expect(badDate.statusCode).toBe(400);
    expect(badDate.json().errors.date).toEqual(['Use a date like 2026-05-15.']);
  });

  it('needs a valid access token', async () => {
    expect((await summary('', null)).statusCode).toBe(401);
  });
});
