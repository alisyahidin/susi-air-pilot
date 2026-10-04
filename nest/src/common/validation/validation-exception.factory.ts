import { BadRequestException, type StandardSchemaValidationPipeOptions } from '@nestjs/common';

type Issues = Parameters<NonNullable<StandardSchemaValidationPipeOptions['exceptionFactory']>>[0];

/**
 * Turns Standard Schema issues into a 400 whose errors are keyed by field, so a form can
 * show each message under its input:
 *
 *   { "message": "Validation failed", "errors": { "username": ["Enter your username."] } }
 *
 * Issues about the value as a whole (e.g. a missing body) are listed under "_root".
 */
export function validationExceptionFactory(issues: Issues): BadRequestException {
  const errors: Record<string, string[]> = {};
  for (const issue of issues) {
    const field = issue.path?.length
      ? issue.path.map(segment => String(typeof segment === 'object' ? segment.key : segment)).join('.')
      : '_root';
    (errors[field] ??= []).push(issue.message);
  }
  return new BadRequestException({ message: 'Validation failed', errors });
}
