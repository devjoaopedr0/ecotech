import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Wraps PrismaClient as a NestJS provider so it participates in the DI
 * container's lifecycle: connects when the module boots, disconnects
 * cleanly on shutdown. Every repository in the app depends on this single
 * instance instead of instantiating its own PrismaClient.
 *
 * A partir do Prisma 7, o client não conecta mais sozinho a partir de
 * DATABASE_URL — é obrigatório passar um "driver adapter" explícito. Aqui
 * usamos @prisma/adapter-pg (node-postgres), lendo a connection string via
 * ConfigService para manter a mesma fonte de configuração do resto da app.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.get<string>('DATABASE_URL'),
    });
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conectado ao banco de dados via Prisma');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
