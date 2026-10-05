import { z } from 'zod';

const DEV_JWT_SECRET = 'dev-only-insecure-jwt-secret-do-not-use-in-production';

/** A duration the auth library accepts: "250ms", "30s", "15m", "6h", "3d", "1w". */
const duration = z
  .string()
  .regex(/^\d+(ms|s|m|h|d|w)$/, 'Use a number with a unit: ms, s, m, h, d or w (e.g. 15m)')
  .transform(value => value as `${number}${'ms' | 's' | 'm' | 'h' | 'd' | 'w'}`);

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    // Browser origins allowed to call the API (comma-separated), e.g. the Nuxt app
    CORS_ORIGIN: z
      .string()
      .default('http://localhost:3000')
      .transform(value => value.split(',').map(origin => origin.trim()).filter(Boolean))
      .pipe(z.array(z.url({ protocol: /^https?$/, error: 'CORS_ORIGIN must be http(s) origins, comma-separated' })).min(1)),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
    JWT_ISSUER: z.string().min(1).default('susi-air'),
    JWT_ACCESS_TTL: duration.default('15m'),
    JWT_REFRESH_TTL: duration.default('30d'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.JWT_SECRET) {
      ctx.addIssue({ code: 'custom', path: ['JWT_SECRET'], message: 'JWT_SECRET is required in production' });
    }
  })

  .transform(env => ({ ...env, JWT_SECRET: env.JWT_SECRET ?? DEV_JWT_SECRET }));

export type Env = z.infer<typeof envSchema>;

export function readEnv(): Env {
  return envSchema.parse(process.env);
}
