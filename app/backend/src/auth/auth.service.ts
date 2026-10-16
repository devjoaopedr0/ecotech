import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AuthResponseDto, ChangePasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';

/** Payload dos JWTs. `sub` é o id do usuário; `sv` é a sessionVersion, que
 * invalida os tokens antigos quando a senha muda. */
export interface JwtPayload {
  sub: string;
  sv: number;
}

@Injectable()
export class AuthService {
  private static readonly BCRYPT_SALT_ROUNDS = 12;

  // Comparado quando o e-mail não existe, para o tempo de resposta do login
  // não revelar quais e-mails têm conta.
  private readonly dummyPasswordHash = bcrypt.hashSync('ecotech-timing-placeholder', 12);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Já existe uma conta com este e-mail.');
    }

    const passwordHash = await bcrypt.hash(dto.password, AuthService.BCRYPT_SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash },
    });
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? this.dummyPasswordHash,
    );
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    return this.buildAuthResponse(updated);
  }

  /** Troca um refresh token válido por um novo par de tokens. */
  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }
    const user = await this.validatePayload(payload);
    return this.buildAuthResponse(user);
  }

  /** Troca a senha e encerra todas as outras sessões (sessionVersion + 1);
   * devolve tokens novos para a sessão atual continuar. */
  async changePassword(user: User, dto: ChangePasswordDto): Promise<AuthResponseDto> {
    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Senha atual incorreta.');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, AuthService.BCRYPT_SALT_ROUNDS);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
    return this.buildAuthResponse(updated);
  }

  /** Chamado pelo JwtStrategy a cada requisição autenticada. */
  async validatePayload(payload: JwtPayload): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.sessionVersion !== payload.sv) {
      throw new UnauthorizedException('Sessão encerrada. Faça login novamente.');
    }
    return user;
  }

  private async buildAuthResponse(user: User): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: user.id, sv: user.sessionVersion };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        // O tipo de `expiresIn` é um template literal do pacote `ms`; o valor
        // vem do env como string e é validado pela própria lib ao assinar.
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as any,
      }),
    ]);
    return { accessToken, refreshToken, user: UserResponseDto.from(user) };
  }
}
