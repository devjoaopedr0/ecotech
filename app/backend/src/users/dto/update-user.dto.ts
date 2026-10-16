import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Maria Silva' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'name deve ter pelo menos 2 caracteres.' })
  @MaxLength(120, { message: 'name deve ter no máximo 120 caracteres.' })
  name?: string;
}

export class UpdateNotificationPreferenceDto {
  @ApiPropertyOptional({ description: 'Avisos sobre a horta (planta fora da faixa).' })
  @IsOptional()
  @IsBoolean()
  garden?: boolean;

  @ApiPropertyOptional({ description: 'Enviar os avisos também por e-mail.' })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiPropertyOptional({ description: 'Avisos do sistema (sensor offline, atualizações).' })
  @IsOptional()
  @IsBoolean()
  system?: boolean;
}
