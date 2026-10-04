import { StandardSchemaSerializerInterceptor, StandardSchemaValidationPipe, type Provider } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import { validationExceptionFactory } from './validation-exception.factory.js';

/**
 * Nest's built-in Standard Schema (zod) validation, registered globally:
 * - input:  @Body({ schema }), @Query({ schema }), @Param('id', { schema }) are validated and parsed
 * - output: @SerializeOptions({ schema }) validates the response and strips undeclared keys
 *
 * Parameters and routes without a schema are left alone.
 */
export const validationProviders: Provider[] = [
  {
    provide: APP_PIPE,
    useFactory: () => new StandardSchemaValidationPipe({ exceptionFactory: validationExceptionFactory }),
  },
  {
    provide: APP_INTERCEPTOR,
    useFactory: (reflector: Reflector) => new StandardSchemaSerializerInterceptor(reflector),
    inject: [Reflector],
  },
];
