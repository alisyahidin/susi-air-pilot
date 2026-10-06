import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const DOCS_PATH = 'docs';

/**
 * OpenAPI docs: Swagger UI at /docs, the JSON at /docs-json, and / redirects to /docs.
 * Request and response schemas come from the zod schemas on each route.
 */
export function setupSwagger(app: NestFastifyApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Susi Air Pilot API')
    .setDescription(
      'API for the Susi Air Pilot App. Sign in with `POST /api/v1/auth/login`, then press Authorize and paste the `accessToken`.',
    )
    .setVersion('1')
    .addBearerAuth()
    .build();

  SwaggerModule.setup(DOCS_PATH, app, () => SwaggerModule.createDocument(app, config), {
    swaggerOptions: { persistAuthorization: true },
  });

  app
    .getHttpAdapter()
    .getInstance()
    .get('/', (_request, reply) => reply.redirect(`/${DOCS_PATH}`));
}
