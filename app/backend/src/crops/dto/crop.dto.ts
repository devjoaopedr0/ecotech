import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Crop } from '@prisma/client';
import { IsInt, IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateCropDto {
  @ApiProperty({ example: 'Alface' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @ApiProperty({ example: 15, description: '°C' })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(-20)
  @Max(60)
  temperatureMin: number;

  @ApiProperty({ example: 25, description: '°C' })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(-20)
  @Max(60)
  temperatureMax: number;

  @ApiProperty({ example: 10000, description: 'lux' })
  @IsInt()
  @Min(0)
  @Max(200000)
  lightMin: number;

  @ApiProperty({ example: 25000, description: 'lux' })
  @IsInt()
  @Min(0)
  @Max(200000)
  lightMax: number;

  @ApiProperty({ example: 2, description: 'Irrigações por dia (0.5 = a cada dois dias).' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(24)
  irrigationsPerDay: number;

  @ApiProperty({ example: 45, description: 'Dias do plantio à colheita.' })
  @IsInt()
  @Min(1)
  @Max(3650)
  cycleDays: number;
}

export class UpdateCropDto extends PartialType(CreateCropDto) {}

export class CropResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() temperatureMin: number;
  @ApiProperty() temperatureMax: number;
  @ApiProperty() lightMin: number;
  @ApiProperty() lightMax: number;
  @ApiProperty() irrigationsPerDay: number;
  @ApiProperty() cycleDays: number;

  static from(crop: Crop): CropResponseDto {
    return {
      id: crop.id,
      name: crop.name,
      temperatureMin: Number(crop.temperatureMin),
      temperatureMax: Number(crop.temperatureMax),
      lightMin: crop.lightMin,
      lightMax: crop.lightMax,
      irrigationsPerDay: Number(crop.irrigationsPerDay),
      cycleDays: crop.cycleDays,
    };
  }
}
