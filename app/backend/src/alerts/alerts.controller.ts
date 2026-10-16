import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AlertsService } from './alerts.service';

export class AlertsQueryDto {
  @ApiPropertyOptional({ description: 'Só os não lidos.', default: false })
  @IsOptional()
  // Lê o valor bruto (`obj[key]`): a conversão implícita do ValidationPipe
  // transformaria a string "false" em true.
  @Transform(({ obj, key }) => obj[key] === true || obj[key] === 'true')
  @IsBoolean()
  unread?: boolean;

  @ApiPropertyOptional({ default: 50, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Alertas de umidade, reservatório, temperatura e estresse hídrico (mais recentes primeiro).' })
  list(@CurrentUser() user: User, @Query() query: AlertsQueryDto) {
    return this.alertsService.list(user.id, query.unread ?? false, query.limit ?? 50);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marca todos os alertas como lidos.' })
  markAllRead(@CurrentUser() user: User) {
    return this.alertsService.markAllRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marca um alerta como lido.' })
  markRead(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.alertsService.markRead(user.id, id);
  }
}
