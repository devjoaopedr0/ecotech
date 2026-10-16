import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CropsService } from './crops.service';
import { CreateCropDto, CropResponseDto, UpdateCropDto } from './dto/crop.dto';

@ApiTags('crops')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crops')
export class CropsController {
  constructor(private readonly cropsService: CropsService) {}

  @Get()
  @ApiResponse({ status: 200, type: [CropResponseDto] })
  list(@CurrentUser() user: User): Promise<CropResponseDto[]> {
    return this.cropsService.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra uma cultura com seus parâmetros ideais.' })
  @ApiResponse({ status: 201, type: CropResponseDto })
  create(@CurrentUser() user: User, @Body() dto: CreateCropDto): Promise<CropResponseDto> {
    return this.cropsService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, type: CropResponseDto })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCropDto,
  ): Promise<CropResponseDto> {
    return this.cropsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a cultura; as plantas dela ficam sem cultura.' })
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.cropsService.remove(user.id, id);
  }
}
