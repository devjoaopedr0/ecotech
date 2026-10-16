import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

/**
 * Com `catalogPlantId`, nome, espécie e faixa vêm do catálogo quando não são
 * enviados; sem ele, `name`, `humidityMin` e `humidityMax` são obrigatórios
 * (checado no PlantsService). Em qualquer caso, min < max.
 */
export class CreatePlantDto {
  @ApiPropertyOptional({ description: 'Planta do catálogo usada para preencher os dados.' })
  @IsOptional()
  @IsUUID('4', { message: 'catalogPlantId deve ser um UUID.' })
  catalogPlantId?: string;

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

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  humidityMin?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  humidityMax?: number;
}

export class UpdatePlantDto extends PartialType(CreatePlantDto) {}

export class PlantReadingDto {
  @ApiProperty()
  humidity: number;

  @ApiProperty()
  createdAt: Date;
}

export class PlantIrrigationDto {
  @ApiProperty({ enum: ['AUTO', 'MANUAL'] })
  mode: 'AUTO' | 'MANUAL';

  @ApiProperty()
  isOn: boolean;

  @ApiProperty({ nullable: true })
  lastIrrigationAt: Date | null;
}

export class PlantResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) species: string | null;
  @ApiProperty() emoji: string;
  @ApiProperty({ nullable: true }) location: string | null;
  @ApiProperty() humidityMin: number;
  @ApiProperty() humidityMax: number;
  @ApiProperty({ nullable: true }) catalogPlantId: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ type: PlantReadingDto, nullable: true }) latestReading: PlantReadingDto | null;
  @ApiProperty({ enum: ['LOW', 'ATTENTION', 'IDEAL', 'HIGH'], nullable: true })
  status: 'LOW' | 'ATTENTION' | 'IDEAL' | 'HIGH' | null;
  @ApiProperty({ type: PlantIrrigationDto }) irrigation: PlantIrrigationDto;
}
