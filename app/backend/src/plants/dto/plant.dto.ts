import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';

const HUMIDITY = { minimum: 0, maximum: 100 } as const;

/**
 * Com `catalogPlantId`, nome, espécie e faixa ideal vêm do catálogo quando
 * não são enviados; sem ele, `name`, `idealMin` e `idealMax` são
 * obrigatórios (checado no PlantsService). Limites não enviados são
 * derivados da faixa ideal (`deriveThresholds`). Em qualquer caso:
 * humidityCritical < humidityLow <= idealMin < idealMax <= humidityHigh.
 */
export class CreatePlantDto {
  @ApiPropertyOptional({ description: 'Planta do catálogo usada para preencher os dados.' })
  @IsOptional()
  @IsUUID('4', { message: 'catalogPlantId deve ser um UUID.' })
  catalogPlantId?: string;

  @ApiPropertyOptional({ description: 'Cultura com os parâmetros ideais (temperatura, luz, ciclo).', nullable: true })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID('4', { message: 'cropId deve ser um UUID.' })
  cropId?: string | null;

  @ApiPropertyOptional({ example: 'Tomate da varanda' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: 'Solanum lycopersicum' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  species?: string;

  @ApiPropertyOptional({ example: '🍅' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  emoji?: string;

  @ApiPropertyOptional({ example: 'Varanda' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  location?: string;

  @ApiPropertyOptional({ example: 'Canteiro 02' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  bed?: string;

  @ApiPropertyOptional({ example: '2026-09-20', description: 'Data de plantio (AAAA-MM-DD).', nullable: true })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString({ strict: true }, { message: 'plantedAt deve ser uma data AAAA-MM-DD.' })
  plantedAt?: string | null;

  @ApiPropertyOptional({ ...HUMIDITY, description: 'Abaixo disso a planta fica crítica.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  humidityCritical?: number;

  @ApiPropertyOptional({ ...HUMIDITY, description: 'Abaixo disso a planta pede atenção (solo seco).' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  humidityLow?: number;

  @ApiPropertyOptional({ ...HUMIDITY, description: 'Início da faixa ideal.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  idealMin?: number;

  @ApiPropertyOptional({ ...HUMIDITY, description: 'Fim da faixa ideal.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  idealMax?: number;

  @ApiPropertyOptional({ ...HUMIDITY, description: 'Acima disso a planta pede atenção (excesso de água).' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  humidityHigh?: number;
}

export class UpdatePlantDto extends PartialType(CreatePlantDto) {}

export class PlantReadingDto {
  @ApiProperty() humidity: number;
  @ApiProperty() createdAt: Date;
}

export class IrrigationCycleDto {
  @ApiProperty({ enum: ['AUTO', 'MANUAL'] }) source: 'AUTO' | 'MANUAL';
  @ApiProperty() reason: string;
  @ApiProperty() startedAt: Date;
  @ApiProperty({ nullable: true }) plannedDurationMin: number | null;
  @ApiProperty({ nullable: true }) humidityBefore: number | null;
}

export class PlantIrrigationDto {
  @ApiProperty({ enum: ['AUTO', 'MANUAL'] }) mode: 'AUTO' | 'MANUAL';
  @ApiProperty() isOn: boolean;
  @ApiProperty() autoBlocked: boolean;
  @ApiProperty() flowRateLpm: number;
  @ApiProperty({ nullable: true }) lastIrrigationAt: Date | null;
  @ApiProperty({ type: IrrigationCycleDto, nullable: true }) currentCycle: IrrigationCycleDto | null;
}

export class PlantResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) species: string | null;
  @ApiProperty() emoji: string;
  @ApiProperty({ nullable: true }) location: string | null;
  @ApiProperty({ nullable: true }) bed: string | null;
  @ApiProperty({ nullable: true, example: '2026-09-20' }) plantedAt: string | null;
  @ApiProperty({ nullable: true }) cropId: string | null;
  @ApiProperty({ nullable: true }) catalogPlantId: string | null;
  @ApiProperty() humidityCritical: number;
  @ApiProperty() humidityLow: number;
  @ApiProperty() idealMin: number;
  @ApiProperty() idealMax: number;
  @ApiProperty() humidityHigh: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ type: PlantReadingDto, nullable: true }) latestReading: PlantReadingDto | null;
  @ApiProperty({ nullable: true, description: 'Última temperatura do ar medida junto à planta (°C).' })
  temperature: number | null;
  @ApiProperty({ enum: ['CRITICAL', 'LOW', 'IDEAL', 'HIGH'], nullable: true })
  status: 'CRITICAL' | 'LOW' | 'IDEAL' | 'HIGH' | null;
  @ApiProperty({ nullable: true, description: 'Queda média de umidade por hora nas últimas 12 h (%/h).' })
  dryingRatePerHour: number | null;
  @ApiProperty({ type: PlantIrrigationDto }) irrigation: PlantIrrigationDto;
}
