import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateNotificationPreferenceDto, UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch()
  @ApiOperation({ summary: 'Atualiza o perfil do usuário autenticado.' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  update(@CurrentUser() user: User, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
    return this.usersService.update(user.id, dto);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Preferências de notificação (horta, e-mail, sistema).' })
  getNotifications(@CurrentUser() user: User) {
    return this.usersService.getNotificationPreference(user.id);
  }

  @Patch('notifications')
  @ApiOperation({ summary: 'Atualiza as preferências de notificação.' })
  updateNotifications(@CurrentUser() user: User, @Body() dto: UpdateNotificationPreferenceDto) {
    return this.usersService.updateNotificationPreference(user.id, dto);
  }
}
