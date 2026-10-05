import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp } from '../../testing/create-test-app.js';

describe('SchedulesController (GET /api/v1/schedules)', () => {
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

  const schedules = (query = '', token: string | null = accessToken) =>
    app.inject({
      method: 'GET',
      url: `/api/v1/schedules${query}`,
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });

  it("returns the month's duty days in date order, with the legend and the months that have duties", async () => {
    const res = await schedules('?year=2026&month=5');

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({ year: 2026, month: 5, available: { from: '2026-04', to: '2026-06' } });
    expect(body.legend).toHaveLength(10);
    expect(body.legend[0]).toEqual({ code: 'DTY', label: 'On Duty', color: '#10B981' });

    expect(body.days).toHaveLength(21);
    expect(body.days[0]).toEqual({
      id: '97017',
      date: '2026-05-01',
      status: 'completed',
      dutyType: 'DTY',
      baseName: 'PDG',
      baseColor: '#10B981',
      countSchedules: 2,
      countLogbooks: 2,
    });
    expect(body.days.at(-1)).toMatchObject({ date: '2026-05-31', status: 'upcoming', countLogbooks: 0 });
    expect(body.days.filter((d: { status: string }) => d.status === 'upcoming')).toHaveLength(11);
  });

  it('only includes days from the requested month', async () => {
    const { days } = (await schedules('?year=2026&month=4')).json();
    expect(days).toHaveLength(17);
    expect(days.every((d: { date: string }) => d.date.startsWith('2026-04-'))).toBe(true);
  });

  it('defaults to the month of TODAY', async () => {
    const res = (await schedules()).json();
    expect(res).toMatchObject({ year: 2026, month: 5 });
    expect(res.days).toHaveLength(21);
  });

  it('returns no days for a month without duties, still with the legend and range', async () => {
    const res = (await schedules('?year=2026&month=8')).json();
    expect(res.days).toEqual([]);
    expect(res.legend).toHaveLength(10);
    expect(res.available).toEqual({ from: '2026-04', to: '2026-06' });
  });

  it('answers 400 for an invalid year or month', async () => {
    const badMonth = await schedules('?year=2026&month=13');
    expect(badMonth.statusCode).toBe(400);
    expect(badMonth.json().errors.month).toEqual(['Use a month from 1 to 12.']);
    expect((await schedules('?year=abc&month=5')).statusCode).toBe(400);
  });

  it('needs a valid access token', async () => {
    expect((await schedules('', null)).statusCode).toBe(401);
    expect((await schedules('', 'not.a.token')).statusCode).toBe(401);
  });
});
