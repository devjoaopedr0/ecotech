import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Device, User } from '@prisma/client';
import { IsNumber, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentDevice } from '../common/decorators/current-device.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PeriodQueryDto } from '../common/period-query.dto';
import { DeviceTokenGuard } from '../devices/device-token.guard';
import { IngestResult, ReadingsService } from './readings.service';

export class CreateReadingDto {
  @ApiProperty({ example: 47.5, minimum: 0, maximum: 100, description: 'Umidade do solo em %.' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'humidity deve ser um número com até 2 casas decimais.' })
  @Min(0)
  @Max(100)
  humidity: number;
}

@ApiTags('readings')
@Controller()
export class ReadingsController {
  constructor(private readonly readingsService: ReadingsService) {}

  @Post('readings')
  @UseGuards(DeviceTokenGuard)
  @ApiHeader({ name: 'X-Device-Token', required: true, description: 'Token gerado no cadastro do sensor.' })
  @ApiOperation({
    summary: 'Ingestão de leitura pelo ESP32.',
    description: 'A resposta traz o comando de irrigação (ON/OFF) que o dispositivo deve aplicar.',
  })
  ingest(@CurrentDevice() device: Device, @Body() dto: CreateReadingDto): Promise<IngestResult> {
    return this.readingsService.ingest(device, dto.humidity);
  }

  @Get('plants/:plantId/readings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leituras brutas do período, mais recentes primeiro.' })
  list(
    @CurrentUser() user: User,
    @Param('plantId', ParseUUIDPipe) plantId: string,
    @Query() query: PeriodQueryDto,
  ) {
    return this.readingsService.list(user.id, plantId, query.period ?? '24h');
  }

  @Get('plants/:plantId/readings/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Histórico agregado em buckets (média, mín e máx), para o gráfico.' })
  history(
    @CurrentUser() user: User,
    @Param('plantId', ParseUUIDPipe) plantId: string,
    @Query() query: PeriodQueryDto,
  ) {
    return this.readingsService.history(user.id, plantId, query.period ?? '24h');
  }

  @Get('plants/:plantId/readings/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atual, média, mín, máx, amplitude e tendência do período.' })
  stats(
    @CurrentUser() user: User,
    @Param('plantId', ParseUUIDPipe) plantId: string,
    @Query() query: PeriodQueryDto,
  ) {
    return this.readingsService.stats(user.id, plantId, query.period ?? '24h');
  }
}
