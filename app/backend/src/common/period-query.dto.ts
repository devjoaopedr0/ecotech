import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { Period, PERIODS } from '../domain/humidity';

export class PeriodQueryDto {
  @ApiPropertyOptional({ enum: PERIODS, default: '24h' })
  @IsOptional()
  @IsIn(PERIODS, { message: `period deve ser um de: ${PERIODS.join(', ')}.` })
  period?: Period;
}
