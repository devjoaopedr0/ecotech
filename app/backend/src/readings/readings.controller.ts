import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Device, User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { parseRange } from '../common/date-range';
import { CurrentDevice } from '../common/decorators/current-device.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PeriodQueryDto } from '../common/period-query.dto';
import { DeviceTokenGuard } from '../devices/device-token.guard';
import { CollectedReadingDto, CreateReadingDto, IngestResultDto, ReadingsRangeQueryDto } from './dto/reading.dto';
import { ReadingsService } from './readings.service';

@ApiTags('readings')
@Controller()
export class ReadingsController {
  constructor(private readonly readingsService: ReadingsService) {}

  @Post('readings')
  @UseGuards(DeviceTokenGuard)
  @ApiHeader({ name: 'X-Device-Token', required: true, description: 'Token gerado no cadastro da placa.' })
  @ApiOperation({
    summary: 'Ingestão de leitura pela placa (ESP32/Arduino).',
    description: 'A resposta traz o comando de irrigação (ON/OFF) que a placa deve aplicar.',
  })
  @ApiResponse({ status: 201, type: IngestResultDto })
  ingest(@CurrentDevice() device: Device, @Body() dto: CreateReadingDto): Promise<IngestResultDto> {
    return this.readingsService.ingest(device, dto);
  }

  @Get('readings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leituras de todas as placas no intervalo (até 31 dias), mais recentes primeiro.' })
  @ApiResponse({ status: 200, type: [CollectedReadingDto] })
  listAll(@CurrentUser() user: User, @Query() query: ReadingsRangeQueryDto): Promise<CollectedReadingDto[]> {
    const { from, to } = parseRange(query.from, query.to, 31);
    return this.readingsService.listAll(user.id, from, to, query.limit ?? 500);
  }

  @Get('plants/:plantId/readings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leituras de umidade do período, mais recentes primeiro.' })
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
