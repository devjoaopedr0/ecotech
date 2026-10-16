import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IrrigationMode, User } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IrrigationService } from './irrigation.service';

export class SetModeDto {
  @ApiProperty({ enum: IrrigationMode })
  @IsEnum(IrrigationMode, { message: 'mode deve ser AUTO ou MANUAL.' })
  mode: IrrigationMode;
}

export class SetStateDto {
  @ApiProperty({ description: 'true liga, false desliga.' })
  @IsBoolean()
  on: boolean;
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

@ApiTags('irrigation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plants/:plantId/irrigation')
export class IrrigationController {
  constructor(private readonly irrigationService: IrrigationService) {}

  @Get()
  @ApiOperation({ summary: 'Modo (AUTO/MANUAL) e estado atual da irrigação.' })
  get(@CurrentUser() user: User, @Param('plantId', ParseUUIDPipe) plantId: string) {
    return this.irrigationService.getSettings(user.id, plantId);
  }

  @Patch('mode')
  @ApiOperation({ summary: 'Troca entre modo automático e manual.' })
  setMode(
    @CurrentUser() user: User,
    @Param('plantId', ParseUUIDPipe) plantId: string,
    @Body() dto: SetModeDto,
  ) {
    return this.irrigationService.setMode(user.id, plantId, dto.mode);
  }

  @Post()
  @ApiOperation({ summary: 'Liga ou desliga a irrigação manualmente.' })
  setState(
    @CurrentUser() user: User,
    @Param('plantId', ParseUUIDPipe) plantId: string,
    @Body() dto: SetStateDto,
  ) {
    return this.irrigationService.setState(user.id, plantId, dto.on);
  }

  @Get('events')
  @ApiOperation({ summary: 'Histórico de ciclos de irrigação (mais recentes primeiro).' })
  events(
    @CurrentUser() user: User,
    @Param('plantId', ParseUUIDPipe) plantId: string,
    @Query() query: EventsQueryDto,
  ) {
    return this.irrigationService.listEvents(user.id, plantId, query.limit ?? 50);
  }
}
