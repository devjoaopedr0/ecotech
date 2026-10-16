import { Type, plainToInstance } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, MinLength, validateSync } from 'class-validator';

/**
 * Valida process.env no boot: se faltar alguma variável obrigatória, a API
 * nem sobe, com uma mensagem clara, em vez de falhar no meio de uma
 * requisição (ex: JWT_SECRET undefined ao assinar um token).
 */
class EnvironmentVariables {
  @IsString()
  DATABASE_URL: string;

  // @Type explícito: o esbuild (tsx) não emite a metadata de decorators que o
  // class-transformer usaria para converter "3333" em número sozinho.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number;

  @IsString()
  CORS_ORIGIN: string;

  @IsString()
  @MinLength(16, { message: 'JWT_SECRET deve ter pelo menos 16 caracteres.' })
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;

  @IsString()
  @MinLength(16, { message: 'JWT_REFRESH_SECRET deve ter pelo menos 16 caracteres.' })
  JWT_REFRESH_SECRET: string;

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1000)
  RATE_LIMIT_TTL_MS?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  RATE_LIMIT_MAX?: number;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('\n');
    throw new Error(`Configuração de ambiente inválida:\n${messages}`);
  }

  return validatedConfig;
}
