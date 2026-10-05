import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { OriginGuard } from './common/security/index.js';
import { validationProviders } from './common/validation/index.js';
import { appConfig, authConfig, envSchema, type AuthConfig } from './config/index.js';
import { MockDbModule } from './db/mock/index.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DocumentsModule } from './modules/documents/documents.module.js';
import { FlightHoursModule } from './modules/flight-hours/flight-hours.module.js';
import { PilotModule } from './modules/pilot/pilot.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: envSchema,
      load: [appConfig, authConfig],
    }),
    MockDbModule,
    AuthenticationModule.forRootAsync({
      inject: [authConfig.KEY],
      useFactory: (auth: AuthConfig) => ({
        accessToken: { key: auth.accessToken.secret, issuer: auth.accessToken.issuer, ttl: auth.accessToken.ttl },
        refreshToken: { ttl: auth.refreshToken.ttl },
        allowInMemoryStorage: true,
      }),
    }),
    UsersModule,
    AuthModule,
    PilotModule,
    FlightHoursModule,
    DocumentsModule,
  ],
  providers: [
    // Built-in zod validation: @Body({ schema }) for input, @SerializeOptions({ schema }) for output
    ...validationProviders,
    // CSRF: refuses POST/PUT/PATCH/DELETE from browser origins outside CORS_ORIGIN
    { provide: APP_GUARD, useClass: OriginGuard },
  ],
})
export class AppModule {}
