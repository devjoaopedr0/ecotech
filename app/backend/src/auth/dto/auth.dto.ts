import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsJWT, IsString, MaxLength, MinLength } from 'class-validator';
import { UserResponseDto } from '../../users/dto/user-response.dto';

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString({ message: 'name deve ser um texto.' })
  @MinLength(2, { message: 'name deve ter pelo menos 2 caracteres.' })
  @MaxLength(120, { message: 'name deve ter no máximo 120 caracteres.' })
  name: string;

  @ApiProperty({ example: 'maria@exemplo.com' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'email deve ser um endereço de e-mail válido.' })
  @MaxLength(254, { message: 'email deve ter no máximo 254 caracteres.' })
  email: string;

  @ApiProperty({ example: 'SenhaForte123', minLength: 8, maxLength: 72 })
  @IsString({ message: 'password deve ser um texto.' })
  @MinLength(8, { message: 'password deve ter pelo menos 8 caracteres.' })
  // O bcrypt ignora os bytes depois do 72º; barrar aqui evita uma senha
  // truncada sem a pessoa perceber.
  @MaxLength(72, { message: 'password deve ter no máximo 72 caracteres.' })
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'maria@exemplo.com' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'email deve ser um endereço de e-mail válido.' })
  email: string;

  @ApiProperty({ example: 'SenhaForte123' })
  @IsString({ message: 'password deve ser um texto.' })
  @MaxLength(72)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsJWT({ message: 'refreshToken inválido.' })
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MaxLength(72)
  currentPassword: string;

  @ApiProperty({ minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8, { message: 'newPassword deve ter pelo menos 8 caracteres.' })
  @MaxLength(72, { message: 'newPassword deve ter no máximo 72 caracteres.' })
  newPassword: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT de curta duração, enviado como Bearer token.' })
  accessToken: string;

  @ApiProperty({ description: 'JWT de longa duração, trocado em POST /auth/refresh.' })
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
