import fastifyCookie from '@fastify/cookie';
import { type Type, VersioningType } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module.js';
import { appConfig, type AppConfig } from '../config/index.js';

/**
 * The full app for request-level tests, with the HTTP setup main.ts applies.
 * Keep the two in sync: cookies, the /api prefix, URI versioning and CORS.
 */
export async function createTestApp(extraControllers: Type[] = []): Promise<NestFastifyApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers: extraControllers,
  }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  const { corsOrigins } = app.get<AppConfig>(appConfig.KEY);

  await app.register(fastifyCookie);
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
