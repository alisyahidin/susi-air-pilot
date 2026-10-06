import { STATUS_CODES } from 'node:http';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  errors?: Record<string, string[]>;
  path: string;
  timestamp: string;
}

/**
 * Gives every error the same body:
 * {
 *    "statusCode": 400,
 *    "error": "Bad Request",
 *    "message": "Validation failed",
 *    "errors": { "username": ["Enter your username."] },
 *    "path": "/api/v1/auth/login",
 *    "timestamp": "…"
 * }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.adapterHost;
    const request = host.switchToHttp().getRequest();
    const statusCode = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (statusCode >= 500) {
      this.logger.error(
        `${httpAdapter.getRequestMethod(request)} ${httpAdapter.getRequestUrl(request)}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponse = {
      statusCode,
      error: STATUS_CODES[statusCode] ?? 'Error',
      message: statusCode >= 500 ? 'Internal server error' : messageOf(exception),
      ...errorsOf(exception),
      path: httpAdapter.getRequestUrl(request),
      timestamp: new Date().toISOString(),
    };

    httpAdapter.reply(host.switchToHttp().getResponse(), body, statusCode);
  }
}

function messageOf(exception: unknown): string {
  if (!(exception instanceof HttpException)) return 'Internal server error';
  const response = exception.getResponse();
  const message = typeof response === 'string' ? response : (response as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join('; ');
  return typeof message === 'string' ? message : exception.message;
}

function errorsOf(exception: unknown): Pick<ErrorResponse, 'errors'> {
  const response = exception instanceof HttpException ? exception.getResponse() : undefined;
  const errors = typeof response === 'object' && response ? (response as { errors?: unknown }).errors : undefined;
  return errors && typeof errors === 'object' ? { errors: errors as Record<string, string[]> } : {};
}
