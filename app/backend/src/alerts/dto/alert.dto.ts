import { ApiProperty } from '@nestjs/swagger';
import { Alert, AlertType } from '@prisma/client';

export class AlertResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: AlertType }) type: AlertType;
  @ApiProperty({ nullable: true }) plantId: string | null;
  @ApiProperty({ nullable: true }) deviceId: string | null;
  @ApiProperty({ description: 'Umidade ou nível em %, temperatura em °C ou diferença folha − ar em °C.' })
  value: number;
  @ApiProperty({ nullable: true }) readAt: Date | null;
  @ApiProperty() createdAt: Date;

  static from(alert: Alert): AlertResponseDto {
    return {
      id: alert.id,
      type: alert.type,
      plantId: alert.plantId,
      deviceId: alert.deviceId,
      value: Number(alert.value),
      readAt: alert.readAt,
      createdAt: alert.createdAt,
    };
  }
}
