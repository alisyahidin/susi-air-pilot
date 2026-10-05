import type { CookieSerializeOptions } from '@fastify/cookie';

export const REFRESH_TOKEN_COOKIE = 'susi_refresh_token';

/**
 * - httpOnly: out of reach of page scripts (XSS)
 * - SameSite=Strict: never sent on requests started by another site (CSRF, with OriginGuard)
 * - Path=/api/v1/auth: only sent to refresh and logout, never with ordinary API calls
 * - Secure in production: only over HTTPS
 */
export function refreshTokenCookieOptions(secure: boolean): CookieSerializeOptions {
  return { httpOnly: true, sameSite: 'strict', path: '/api/v1/auth', secure };
}

const UNIT_SECONDS = { ms: 0.001, s: 1, m: 60, h: 3600, d: 86400, w: 604800 } as const;

/** "30d" → 2592000, for the cookie's Max-Age (the env schema guarantees the format). */
export function durationToSeconds(duration: string): number {
  const [, amount, unit] = /^(\d+)(ms|s|m|h|d|w)$/.exec(duration)!;
  return Math.floor(Number(amount) * UNIT_SECONDS[unit as keyof typeof UNIT_SECONDS]);
}
