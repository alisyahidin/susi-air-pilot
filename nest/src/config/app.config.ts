import { registerAs, type ConfigType } from '@nestjs/config';
import { readEnv } from './env.schema.js';

export const appConfig = registerAs('app', () => {
  const env = readEnv();
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    corsOrigins: env.CORS_ORIGIN,
  };
});

export type AppConfig = ConfigType<typeof appConfig>;
