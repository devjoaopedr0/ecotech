import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Device, Reading, SensorBoard } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { effectiveCalibration, isOnline } from '../../domain/sensors';

export class CreateDeviceDto {
  @ApiProperty({ example: 'Sensor da varanda' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ example: 'AA:BB:CC:DD:EE:FF' })
  @IsOptional()
  @Matches(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/, { message: 'macAddress deve estar no formato AA:BB:CC:DD:EE:FF.' })
  macAddress?: string;

  @ApiPropertyOptional({ example: 'Varanda' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  location?: string;

  @ApiPropertyOptional({ description: 'Planta monitorada por esta placa.' })
  @IsOptional()
  @IsUUID('4')
  plantId?: string;

  @ApiPropertyOptional({ enum: SensorBoard, default: SensorBoard.ESP32 })
  @IsOptional()
  @IsEnum(SensorBoard, { message: 'board deve ser ARDUINO ou ESP32.' })
  board?: SensorBoard;

  @ApiPropertyOptional({ example: 10, description: 'Profundidade do sensor de umidade (cm).' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  depthCm?: number;

  @ApiPropertyOptional({ example: 'Centro do canteiro' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  position?: string;
}

export class UpdateDeviceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ nullable: true, description: 'null desvincula a placa da planta.' })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID('4')
  plantId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  depthCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  position?: string;
}

/** A escala dos valores é validada contra a placa no DevicesService. */
export class CalibrationDto {
  @ApiProperty({ enum: SensorBoard })
  @IsEnum(SensorBoard, { message: 'board deve ser ARDUINO ou ESP32.' })
  board: SensorBoard;

  @ApiProperty({ example: 3200, description: 'Leitura bruta com o sensor no ar (0%).' })
  @IsInt()
  @Min(0)
  rawDry: number;

  @ApiProperty({ example: 1300, description: 'Leitura bruta com o sensor na água (100%).' })
  @IsInt()
  @Min(0)
  rawWet: number;
}

export class CalibrationResponseDto {
  @ApiProperty() rawDry: number;
  @ApiProperty() rawWet: number;
  @ApiProperty({ description: 'true quando ainda vale a calibração padrão da placa.' }) isDefault: boolean;
}

export class DeviceReadingDto {
  @ApiProperty({ nullable: true }) humidity: number | null;
  @ApiProperty({ nullable: true }) rawValue: number | null;
  @ApiProperty({ nullable: true }) temperature: number | null;
  @ApiProperty({ nullable: true }) airHumidity: number | null;
  @ApiProperty({ nullable: true }) leafTemperature: number | null;
  @ApiProperty({ nullable: true }) light: number | null;
  @ApiProperty({ nullable: true }) waterLevel: number | null;
  @ApiProperty() createdAt: Date;
}

const num = (value: unknown) => (value == null ? null : Number(value));

export class DeviceResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) macAddress: string | null;
  @ApiProperty({ nullable: true }) location: string | null;
  @ApiProperty() active: boolean;
  @ApiProperty({ nullable: true }) plantId: string | null;
  @ApiProperty({ enum: SensorBoard }) board: SensorBoard;
  @ApiProperty({ type: CalibrationResponseDto }) calibration: CalibrationResponseDto;
  @ApiProperty({ nullable: true }) depthCm: number | null;
  @ApiProperty({ nullable: true }) position: string | null;
  @ApiProperty({ description: 'Enviou leitura nos últimos 5 minutos.' }) online: boolean;
  @ApiProperty({ nullable: true }) lastSeenAt: Date | null;
  @ApiProperty({ type: DeviceReadingDto, nullable: true }) latestReading: DeviceReadingDto | null;
  @ApiProperty() createdAt: Date;

  static from(device: Device, latest: Reading | null = null, now = new Date()): DeviceResponseDto {
    return {
      id: device.id,
      name: device.name,
      macAddress: device.macAddress,
      location: device.location,
      active: device.active,
      plantId: device.plantId,
      board: device.board,
      calibration: { ...effectiveCalibration(device), isDefault: device.rawDry === null || device.rawWet === null },
      depthCm: device.depthCm,
      position: device.position,
      online: device.active && isOnline(device.lastSeenAt, now),
      lastSeenAt: device.lastSeenAt,
      latestReading: latest
        ? {
            humidity: num(latest.humidity),
            rawValue: latest.rawValue,
            temperature: num(latest.temperature),
            airHumidity: num(latest.airHumidity),
            leafTemperature: num(latest.leafTemperature),
            light: latest.light,
            waterLevel: num(latest.waterLevel),
            createdAt: latest.createdAt,
          }
        : null,
      createdAt: device.createdAt,
    };
  }
}

export class DeviceWithTokenDto extends DeviceResponseDto {
  @ApiProperty({
    description:
      'Token do dispositivo, enviado pela placa no header X-Device-Token. ' +
      'Só aparece nesta resposta: o banco guarda apenas o hash.',
  })
  token: string;
}
