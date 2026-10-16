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
import { DevicesService } from './devices.service';
import { CreateDeviceDto, DeviceResponseDto, DeviceWithTokenDto, UpdateDeviceDto } from './dto/device.dto';

@ApiTags('devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiResponse({ status: 200, type: [DeviceResponseDto] })
  list(@CurrentUser() user: User): Promise<DeviceResponseDto[]> {
    return this.devicesService.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra um sensor. O token só é exibido nesta resposta.' })
  @ApiResponse({ status: 201, type: DeviceWithTokenDto })
  create(@CurrentUser() user: User, @Body() dto: CreateDeviceDto): Promise<DeviceWithTokenDto> {
    return this.devicesService.create(user.id, dto);
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: DeviceResponseDto })
  get(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<DeviceResponseDto> {
    return this.devicesService.get(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Renomeia, ativa/desativa ou (des)vincula o sensor a uma planta.' })
  @ApiResponse({ status: 200, type: DeviceResponseDto })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeviceDto,
  ): Promise<DeviceResponseDto> {
    return this.devicesService.update(user.id, id, dto);
  }

  @Post(':id/token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gera um novo token e invalida o anterior.' })
  @ApiResponse({ status: 200, type: DeviceWithTokenDto })
  rotateToken(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<DeviceWithTokenDto> {
    return this.devicesService.rotateToken(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.devicesService.remove(user.id, id);
  }
}
