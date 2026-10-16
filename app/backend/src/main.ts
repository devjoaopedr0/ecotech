import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN')?.split(',').map((origin) => origin.trim()),
    credentials: true,
  });

  // whitelist + forbidNonWhitelisted rejeitam campos não declarados nos DTOs
  // (evita mass assignment, ex: mandar userId no corpo).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('EcoTech API')
    .setDescription('Contas, plantas, sensores, leituras de umidade, irrigação e alertas.')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = configService.get<number>('PORT') ?? 3333;
  await app.listen(port);
  console.log(`EcoTech API em http://localhost:${port} (Swagger em /docs)`);
}

bootstrap();
