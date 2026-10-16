import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Device } from '@prisma/client';
import { IsBoolean, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';

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

  @ApiPropertyOptional({ description: 'Planta monitorada por este sensor.' })
  @IsOptional()
  @IsUUID('4')
  plantId?: string;
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

  @ApiPropertyOptional({ nullable: true, description: 'null desvincula o sensor da planta.' })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID('4')
  plantId?: string | null;
}

export class DeviceResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) macAddress: string | null;
  @ApiProperty({ nullable: true }) location: string | null;
  @ApiProperty() active: boolean;
  @ApiProperty({ nullable: true }) plantId: string | null;
  @ApiProperty({ nullable: true }) lastSeenAt: Date | null;
  @ApiProperty() createdAt: Date;

  static from(device: Device): DeviceResponseDto {
    return {
      id: device.id,
      name: device.name,
      macAddress: device.macAddress,
      location: device.location,
      active: device.active,
      plantId: device.plantId,
      lastSeenAt: device.lastSeenAt,
      createdAt: device.createdAt,
    };
  }
}

export class DeviceWithTokenDto extends DeviceResponseDto {
  @ApiProperty({
    description:
      'Token do dispositivo, enviado pelo ESP32 no header X-Device-Token. ' +
      'Só aparece nesta resposta: o banco guarda apenas o hash.',
  })
  token: string;
}
