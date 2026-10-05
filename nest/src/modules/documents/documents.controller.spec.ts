import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp } from '../../testing/create-test-app.js';
import { statusOf } from './documents.service.js';

describe('statusOf', () => {
  it('is expired on or after the expiry date, expiring within the warning days, valid before', () => {
    expect(statusOf(-1, 30)).toBe('expired');
    expect(statusOf(0, 30)).toBe('expired'); // the expiry date itself
    expect(statusOf(1, 30)).toBe('expiring');
    expect(statusOf(30, 30)).toBe('expiring');
    expect(statusOf(31, 30)).toBe('valid');
  });
});

describe('DocumentsController (GET /api/v1/documents)', () => {
  let app: NestFastifyApplication;
  let accessToken: string;

  beforeAll(async () => {
    vi.stubEnv('TODAY', '2026-05-31');
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

  const documents = (query = '', token: string | null = accessToken) =>
    app.inject({
      method: 'GET',
      url: `/api/v1/documents${query}`,
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });

  it('measures each document from TODAY, soonest expiry first', async () => {
    const res = await documents();

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      date: '2026-05-31',
      documents: [
        { id: 'doc_security', label: 'Security Clearance Exp. Date', expiryDate: '2026-05-01', daysRemaining: -30, status: 'expired' },
        { id: 'doc_license', label: 'Indonesian License Exp. Date', expiryDate: '2026-05-29', daysRemaining: -2, status: 'expired' },
        { id: 'doc_medical', label: 'Indonesian Medical Exp. Date', expiryDate: '2026-06-11', daysRemaining: 11, status: 'expiring' },
        { id: 'doc_recurrent', label: 'Next Recurrent Date', expiryDate: '2026-10-14', daysRemaining: 136, status: 'valid' },
        { id: 'doc_ppc', label: 'PPC Exp. Date', expiryDate: '2026-12-25', daysRemaining: 208, status: 'valid' },
      ],
    });
  });

  it('takes no date: TODAY decides, a date query parameter is ignored', async () => {
    const res = await documents('?date=2025-01-01');
    expect(res.statusCode).toBe(200);
    expect(res.json().date).toBe('2026-05-31');
  });

  it('needs a valid access token', async () => {
    expect((await documents('', null)).statusCode).toBe(401);
    expect((await documents('', 'not.a.token')).statusCode).toBe(401);
  });
});

describe('DocumentsController with another TODAY', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    vi.stubEnv('TODAY', '2026-05-15');
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  it('moves the statuses with TODAY', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'johndoe', password: 'susiairtest' },
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/documents',
      headers: { authorization: `Bearer ${login.json().accessToken}` },
    });

    expect(res.json().date).toBe('2026-05-15');
    expect(res.json().documents.map((d: { id: string, status: string }) => `${d.id}:${d.status}`)).toEqual([
      'doc_security:expired',
      'doc_license:expiring',
      'doc_medical:expiring',
      'doc_recurrent:valid',
      'doc_ppc:valid',
    ]);
  });
});
