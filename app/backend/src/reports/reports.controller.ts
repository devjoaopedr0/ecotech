import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { parseRange } from '../common/date-range';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { isValidTimeZone } from '../domain/water';
import { WaterReportDto, WaterReportQueryDto } from './dto/report.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('water')
  @ApiOperation({
    summary: 'Água usada, economia contra irrigação de horário fixo, custo e indicadores por dia (até 90 dias).',
  })
  @ApiResponse({ status: 200, type: WaterReportDto })
  water(@CurrentUser() user: User, @Query() query: WaterReportQueryDto): Promise<WaterReportDto> {
    const tz = query.tz ?? 'America/Sao_Paulo';
    if (!isValidTimeZone(tz)) throw new BadRequestException('tz deve ser um fuso IANA, ex.: America/Sao_Paulo.');
    const { from, to } = parseRange(query.from, query.to, 90);
    return this.reportsService.water(user.id, from, to, tz);
  }
}
