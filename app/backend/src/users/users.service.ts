import { Injectable } from '@nestjs/common';
import { NotificationPreference } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateNotificationPreferenceDto, UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async update(userId: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({ where: { id: userId }, data: dto });
    return UserResponseDto.from(user);
  }

  /** As preferências são criadas com os valores padrão no primeiro acesso. */
  getNotificationPreference(userId: string): Promise<NotificationPreference> {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  updateNotificationPreference(
    userId: string,
    dto: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreference> {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }
}
