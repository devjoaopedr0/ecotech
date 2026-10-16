import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

/**
 * Corpo enviado pela placa. Todas as grandezas são opcionais (a placa manda
 * as que tem), mas pelo menos uma é obrigatória. Para a umidade do solo, o
 * recomendado é mandar `rawValue` e deixar a conversão para o sistema
 * (calibração do dispositivo); `humidity` já em % continua aceito.
 */
export class CreateReadingDto {
  @ApiPropertyOptional({ example: 47.5, minimum: 0, maximum: 100, description: 'Umidade do solo em %.' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'humidity deve ser um número com até 2 casas decimais.' })
  @Min(0)
  @Max(100)
  humidity?: number;

  @ApiPropertyOptional({ example: 2240, description: 'Valor bruto do ADC do sensor de umidade.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4095)
  rawValue?: number;

  @ApiPropertyOptional({ example: 26.4, description: 'Temperatura do ar (°C).' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(-40)
  @Max(85)
  temperature?: number;

  @ApiPropertyOptional({ example: 62, description: 'Umidade relativa do ar (%).' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  airHumidity?: number;

  @ApiPropertyOptional({ example: 27.1, description: 'Temperatura da folha (°C).' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(-40)
  @Max(85)
  leafTemperature?: number;

  @ApiPropertyOptional({ example: 18000, description: 'Luminosidade (lux).' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200000)
  light?: number;

  @ApiPropertyOptional({ example: 64, description: 'Nível do reservatório (%).' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  waterLevel?: number;
}

export class IngestResultDto {
  @ApiProperty() readingId: string;
  @ApiProperty({ nullable: true }) plantId: string | null;
  @ApiProperty({ nullable: true }) humidity: number | null;
  @ApiProperty({ enum: ['CRITICAL', 'LOW', 'IDEAL', 'HIGH'], nullable: true })
  status: 'CRITICAL' | 'LOW' | 'IDEAL' | 'HIGH' | null;
  @ApiProperty({ enum: ['ON', 'OFF'], description: 'Comando para a placa aplicar na válvula ou bomba.' })
  irrigation: 'ON' | 'OFF';
  @ApiProperty({ nullable: true, description: 'Com a irrigação ligada: segundos até desligar sozinha, mesmo sem conexão.' })
  maxRunSec: number | null;
}

export class ReadingsRangeQueryDto {
  @ApiProperty({ example: '2026-10-15T03:00:00.000Z' })
  @IsDateString()
  from: string;

  @ApiProperty({ example: '2026-10-16T03:00:00.000Z' })
  @IsDateString()
  to: string;

  @ApiPropertyOptional({ default: 500, maximum: 2000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  limit?: number;
}

export class CollectedReadingDto {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true }) plantId: string | null;
  @ApiProperty({ nullable: true }) plantName: string | null;
  @ApiProperty({ nullable: true }) deviceId: string | null;
  @ApiProperty({ nullable: true }) deviceName: string | null;
  @ApiProperty({ nullable: true }) humidity: number | null;
  @ApiProperty({ nullable: true }) rawValue: number | null;
  @ApiProperty({ nullable: true }) temperature: number | null;
  @ApiProperty() createdAt: Date;
}
