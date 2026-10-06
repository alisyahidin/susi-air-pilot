import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import { appConfig, type AppConfig } from './config/index.js';
import { setupSwagger } from './common/swagger/index.js';
import fastifyCookie from '@fastify/cookie';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

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

  setupSwagger(app);

  const { port } = app.get<AppConfig>(appConfig.KEY);
  await app.listen(port, '0.0.0.0');
}
await bootstrap();
