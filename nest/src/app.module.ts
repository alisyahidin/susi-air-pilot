import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { appConfig, authConfig, envSchema, type AuthConfig } from './config/index.js';
import { MockDbModule } from './db/mock/index.js';
import { AuthModule } from './modules/auth/auth.module.js';
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
  ],
  providers: [],
})
export class AppModule {}
