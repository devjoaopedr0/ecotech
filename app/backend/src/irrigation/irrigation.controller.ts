import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { parseRange } from '../common/date-range';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  AllEventsQueryDto,
  EventsQueryDto,
  IrrigationEventDto,
  IrrigationSettingsDto,
  SetStateDto,
  UpdateIrrigationSettingsDto,
} from './dto/irrigation.dto';
import { IrrigationService } from './irrigation.service';

@ApiTags('irrigation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plants/:plantId/irrigation')
export class IrrigationController {
  constructor(private readonly irrigationService: IrrigationService) {}

  @Get()
  @ApiOperation({ summary: 'Modo (AUTO/MANUAL), estado, bloqueio do automático e vazão.' })
  @ApiResponse({ status: 200, type: IrrigationSettingsDto })
  get(@CurrentUser() user: User, @Param('plantId', ParseUUIDPipe) plantId: string): Promise<IrrigationSettingsDto> {
    return this.irrigationService.getSettings(user.id, plantId);
  }

  @Patch()
  @ApiOperation({ summary: 'Troca o modo (automático/manual) e/ou a vazão do ponto de irrigação.' })
  @ApiResponse({ status: 200, type: IrrigationSettingsDto })
  update(
    @CurrentUser() user: User,
    @Param('plantId', ParseUUIDPipe) plantId: string,
    @Body() dto: UpdateIrrigationSettingsDto,
  ): Promise<IrrigationSettingsDto> {
    return this.irrigationService.updateSettings(user.id, plantId, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Liga (opcionalmente por N minutos) ou desliga a irrigação manualmente.' })
  @ApiResponse({ status: 201, type: IrrigationSettingsDto })
  setState(
    @CurrentUser() user: User,
    @Param('plantId', ParseUUIDPipe) plantId: string,
    @Body() dto: SetStateDto,
  ): Promise<IrrigationSettingsDto> {
    return this.irrigationService.setState(user.id, plantId, dto.on, dto.on ? dto.durationMin : undefined);
  }

  @Get('events')
  @ApiOperation({ summary: 'Histórico de ciclos da planta (mais recentes primeiro).' })
  @ApiResponse({ status: 200, type: [IrrigationEventDto] })
  events(
    @CurrentUser() user: User,
    @Param('plantId', ParseUUIDPipe) plantId: string,
    @Query() query: EventsQueryDto,
  ): Promise<IrrigationEventDto[]> {
    return this.irrigationService.listEvents(user.id, plantId, query.limit ?? 50);
  }
}

@ApiTags('irrigation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('irrigation')
export class IrrigationHistoryController {
  constructor(private readonly irrigationService: IrrigationService) {}

  @Get('events')
  @ApiOperation({ summary: 'Ciclos de todas as plantas no intervalo (até 90 dias), mais recentes primeiro.' })
  @ApiResponse({ status: 200, type: [IrrigationEventDto] })
  events(@CurrentUser() user: User, @Query() query: AllEventsQueryDto): Promise<IrrigationEventDto[]> {
    const { from, to } = parseRange(query.from, query.to, 90);
    return this.irrigationService.listAllEvents(user.id, from, to, query.limit ?? 200);
  }
}
