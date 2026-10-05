import { type CanActivate, type ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { appConfig, type AppConfig } from '../../config/index.js';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF protection for cookie authentication, alongside the cookie's SameSite=Strict.
 *
 * Browsers always say where a request comes from: `Origin` on cross-origin and on
 * POST/PUT/PATCH/DELETE requests, else `Referer`. For those methods, a request that names
 * an origin must name one in CORS_ORIGIN, otherwise it's refused with 403 before any
 * handler runs. Requests with neither header don't come from a page in a browser (curl,
 * Bruno, server-to-server), so a forged request can't use them, and they pass.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowedOrigins: Set<string>;

  constructor(@Inject(appConfig.KEY) config: AppConfig) {
    this.allowedOrigins = new Set(config.corsOrigins.map(origin => new URL(origin).origin));
  }

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    if (!UNSAFE_METHODS.has(request.method)) return true;

    const origin = request.headers.origin ?? originOf(request.headers.referer);
    if (origin === undefined) return true;
    if (this.allowedOrigins.has(origin)) return true;

    throw new ForbiddenException('Cross-origin request refused');
  }
}

function originOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return 'invalid';
  }
}
