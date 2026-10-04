import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { appConfig, type AppConfig } from './config/index.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1'
  })

  const { port } = app.get<AppConfig>(appConfig.KEY);
  await app.listen(port, '0.0.0.0');
}
await bootstrap();
