import { join } from 'node:path';
import { ClassSerializerInterceptor, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AlertsModule } from './alerts/alerts.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/prisma.module';
import { DevicesModule } from './devices/devices.module';
import { HealthController } from './health.controller';
import { IrrigationModule } from './irrigation/irrigation.module';
import { PlantsModule } from './plants/plants.module';
import { ReadingsModule } from './readings/readings.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      // Relativo a __dirname, e não ao cwd, para achar o .env qualquer que
      // seja o diretório de onde a API foi iniciada.
      envFilePath: join(__dirname, '..', '.env'),
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    PlantsModule,
    DevicesModule,
    IrrigationModule,
    AlertsModule,
    ReadingsModule,
  ],
  controllers: [HealthController],
  providers: [
    RateLimitMiddleware,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
