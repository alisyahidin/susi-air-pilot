import { todayProvider } from './today.js';

describe('todayProvider', () => {
  const today = todayProvider.useValue;

  afterEach(() => vi.unstubAllEnvs());

  it('returns TODAY when it is set', () => {
    vi.stubEnv('TODAY', '2026-05-15');
    expect(today()).toBe('2026-05-15');
  });

  it('falls back to the real date (UTC) when TODAY is unset or empty', () => {
    const realToday = new Date().toISOString().slice(0, 10);
    vi.stubEnv('TODAY', '');
    expect(today()).toBe(realToday);
    delete process.env.TODAY;
    expect(today()).toBe(realToday);
  });
});
