import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IrrigationMode } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, Max, Min, ValidateIf } from 'class-validator';

export class UpdateIrrigationSettingsDto {
  @ApiPropertyOptional({ enum: IrrigationMode })
  @IsOptional()
  @IsEnum(IrrigationMode, { message: 'mode deve ser AUTO ou MANUAL.' })
  mode?: IrrigationMode;

  @ApiPropertyOptional({ example: 2, description: 'Vazão do ponto de irrigação (L/min).' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999)
  flowRateLpm?: number;
}

export class SetStateDto {
  @ApiProperty({ description: 'true liga, false desliga.' })
  @IsBoolean()
  on: boolean;

  @ApiPropertyOptional({ description: 'Só ao ligar: minutos até desligar sozinha. Sem ele, fica ligada até desligarem.' })
  @ValidateIf((dto: SetStateDto) => dto.durationMin !== undefined)
  @IsInt()
  @Min(1)
  @Max(120)
  durationMin?: number;
}

export class EventsQueryDto {
  @ApiPropertyOptional({ default: 50, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class AllEventsQueryDto extends EventsQueryDto {
  @ApiProperty({ example: '2026-10-01T03:00:00.000Z' })
  @IsDateString()
  from: string;

  @ApiProperty({ example: '2026-10-16T03:00:00.000Z' })
  @IsDateString()
  to: string;
}

export class IrrigationSettingsDto {
  @ApiProperty() plantId: string;
  @ApiProperty({ enum: IrrigationMode }) mode: IrrigationMode;
  @ApiProperty() isOn: boolean;
  @ApiProperty() autoBlocked: boolean;
  @ApiProperty() flowRateLpm: number;
  @ApiProperty() updatedAt: Date;
}

export class IrrigationEventDto {
  @ApiProperty() id: string;
  @ApiProperty() plantId: string;
  @ApiProperty() plantName: string;
  @ApiProperty({ nullable: true }) bed: string | null;
  @ApiProperty({ enum: ['AUTO', 'MANUAL'] }) source: 'AUTO' | 'MANUAL';
  @ApiProperty() reason: string;
  @ApiProperty({ nullable: true }) plannedDurationMin: number | null;
  @ApiProperty({ nullable: true, description: 'Null enquanto o ciclo está aberto.' }) durationMin: number | null;
  @ApiProperty({ nullable: true }) humidityBefore: number | null;
  @ApiProperty({ nullable: true }) humidityAfter: number | null;
  @ApiProperty({ nullable: true }) liters: number | null;
  @ApiProperty() startedAt: Date;
  @ApiProperty({ nullable: true }) endedAt: Date | null;
}
