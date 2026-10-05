import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp } from '../../testing/create-test-app.js';

describe('PilotController (GET /api/v1/pilot/me)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(() => app.close());

  const signIn = async (username: string) => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username, password: 'susiairtest' },
    });
    return res.json().accessToken as string;
  };

  const me = (accessToken?: string) =>
    app.inject({
      method: 'GET',
      url: '/api/v1/pilot/me',
      headers: accessToken ? { authorization: `Bearer ${accessToken}` } : {},
    });

  it("returns the signed-in pilot's name, photo and total flight hours", async () => {
    const res = await me(await signIn('johndoe'));

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      name: 'John Doe',
      imageUrl: 'https://i.pravatar.cc/120?u=johndoe',
      totalFlightHours: 1444.5,
    });
  });

  it('answers for whoever the token belongs to', async () => {
    const res = await me(await signIn('udin'));

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ name: 'Udin Sedunia', imageUrl: 'https://i.pravatar.cc/120?u=udin' });
  });

  it('returns only the documented fields', async () => {
    const body = (await me(await signIn('johndoe'))).json();
    expect(Object.keys(body).sort()).toEqual(['imageUrl', 'name', 'totalFlightHours']);
  });

  it('needs a valid access token', async () => {
    expect((await me()).statusCode).toBe(401);
    expect((await me('not.a.token')).statusCode).toBe(401);
  });
});
