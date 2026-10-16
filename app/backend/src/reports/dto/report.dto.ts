import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class WaterReportQueryDto {
  @ApiProperty({ example: '2026-10-09T03:00:00.000Z', description: 'Início (inclusive).' })
  @IsDateString()
  from: string;

  @ApiProperty({ example: '2026-10-16T03:00:00.000Z', description: 'Fim (exclusive).' })
  @IsDateString()
  to: string;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo', default: 'America/Sao_Paulo', description: 'Fuso IANA usado para separar os dias.' })
  @IsOptional()
  @IsString()
  tz?: string;
}

export class WaterDayDto {
  @ApiProperty({ example: '2026-10-15' }) date: string;
  @ApiProperty() usedLiters: number;
  @ApiProperty({ description: 'O que uma irrigação de horário fixo gastaria no dia.' }) conventionalLiters: number;
  @ApiProperty({ nullable: true }) avgHumidity: number | null;
  @ApiProperty({ description: 'Plantas que tiveram ao menos uma leitura crítica no dia.' }) criticalPlants: number;
  @ApiProperty() alerts: number;
}

export class WaterSummaryDto {
  @ApiProperty() usedLiters: number;
  @ApiProperty() conventionalLiters: number;
  @ApiProperty() savedLiters: number;
  @ApiProperty() savingPercent: number;
  @ApiProperty({ description: 'R$' }) cost: number;
  @ApiProperty({ description: 'R$' }) savedCost: number;
}

export class WaterReportDto {
  @ApiProperty() from: Date;
  @ApiProperty() to: Date;
  @ApiProperty() tz: string;
  @ApiProperty({ description: 'R$ por m³.' }) tariffPerM3: number;
  @ApiProperty({ type: [WaterDayDto] }) days: WaterDayDto[];
  @ApiProperty({ type: WaterSummaryDto }) summary: WaterSummaryDto;
}
