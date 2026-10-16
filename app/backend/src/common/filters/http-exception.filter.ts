import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

/**
 * Filtro global: qualquer exceção lançada em qualquer lugar da aplicação
 * passa por aqui e vira uma resposta JSON no mesmo formato — o cliente nunca
 * vê um stack trace ou uma mensagem crua do Postgres/Prisma.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (response.headersSent) {
      return;
    }

    const { status, body } = this.resolve(exception, request.url);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json(body);
  }

  private resolve(exception: unknown, path: string): { status: number; body: ErrorBody } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : ((response as { message?: string | string[] }).message ?? exception.message);

      return {
        status,
        body: {
          statusCode: status,
          message,
          error: HttpStatus[status] ?? 'Error',
          timestamp: new Date().toISOString(),
          path,
        },
      };
    }

    // Corrida entre a checagem manual de duplicidade e a constraint UNIQUE
    // do banco (ex: dois registros simultâneos com o mesmo e-mail) —
    // traduzimos para 409 em vez de vazar um erro do Prisma.
    if (
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      exception.code === 'P2002'
    ) {
      return {
        status: HttpStatus.CONFLICT,
        body: {
          statusCode: HttpStatus.CONFLICT,
          message: 'Registro duplicado.',
          error: 'Conflict',
          timestamp: new Date().toISOString(),
          path,
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro interno do servidor.',
        error: 'Internal Server Error',
        timestamp: new Date().toISOString(),
        path,
      },
    };
  }
}
