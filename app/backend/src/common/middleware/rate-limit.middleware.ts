import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';

interface ClientWindow {
  count: number;
  resetAt: number;
}

/** Limite global em memória, adequado a uma única instância da API. */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly clients = new Map<string, ClientWindow>();
  private readonly ttlMs: number;
  private readonly maxRequests: number;

  constructor(config: ConfigService) {
    this.ttlMs = config.get<number>('RATE_LIMIT_TTL_MS') ?? 60_000;
    this.maxRequests = config.get<number>('RATE_LIMIT_MAX') ?? 100;
  }

  use(request: Request, response: Response, next: NextFunction): void {
    const now = Date.now();
    const key = request.ip || request.socket.remoteAddress || 'unknown';
    let window = this.clients.get(key);

    if (!window || now >= window.resetAt) {
      window = { count: 0, resetAt: now + this.ttlMs };
      this.clients.set(key, window);
      this.removeExpiredWindows(now);
    }

    const remaining = Math.max(0, this.maxRequests - window.count - 1);
    const retryAfterSeconds = Math.max(1, Math.ceil((window.resetAt - now) / 1000));
    response.setHeader('RateLimit-Limit', this.maxRequests);
    response.setHeader('RateLimit-Remaining', remaining);
    response.setHeader('RateLimit-Reset', retryAfterSeconds);

    if (window.count >= this.maxRequests) {
      response.setHeader('Retry-After', retryAfterSeconds);
      throw new HttpException('Muitas requisições. Tente novamente mais tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }

    window.count += 1;
    next();
  }

  private removeExpiredWindows(now: number): void {
    for (const [key, window] of this.clients) {
      if (now >= window.resetAt) this.clients.delete(key);
    }
  }
}
