import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePlantDto, PlantResponseDto, UpdatePlantDto } from './dto/plant.dto';
import { PlantsService } from './plants.service';

@ApiTags('plants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plants')
export class PlantsController {
  constructor(private readonly plantsService: PlantsService) {}

  @Get()
  @ApiOperation({ summary: 'Plantas do usuário, com a última leitura, o status e a irrigação.' })
  @ApiResponse({ status: 200, type: [PlantResponseDto] })
  list(@CurrentUser() user: User): Promise<PlantResponseDto[]> {
    return this.plantsService.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra uma planta (opcionalmente a partir do catálogo).' })
  @ApiResponse({ status: 201, type: PlantResponseDto })
  create(@CurrentUser() user: User, @Body() dto: CreatePlantDto): Promise<PlantResponseDto> {
    return this.plantsService.create(user.id, dto);
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: PlantResponseDto })
  get(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<PlantResponseDto> {
    return this.plantsService.get(user.id, id);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, type: PlantResponseDto })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlantDto,
  ): Promise<PlantResponseDto> {
    return this.plantsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a planta, suas leituras, eventos e alertas.' })
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.plantsService.remove(user.id, id);
  }
}
