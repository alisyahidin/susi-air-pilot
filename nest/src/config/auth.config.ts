import { registerAs, type ConfigType } from '@nestjs/config';
import { readEnv } from './env.schema.js';

export const authConfig = registerAs('auth', () => {
  const env = readEnv();
  return {
    accessToken: {
      secret: env.JWT_SECRET,
      issuer: env.JWT_ISSUER,
      ttl: env.JWT_ACCESS_TTL,
    },
    refreshToken: {
      ttl: env.JWT_REFRESH_TTL,
    },
  };
});

export type AuthConfig = ConfigType<typeof authConfig>;
