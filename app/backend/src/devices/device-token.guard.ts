import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { DevicesService } from './devices.service';

/** Autentica o ESP32 pelo header `X-Device-Token` e anexa o dispositivo em
 * `request.device` (ver @CurrentDevice). */
@Injectable()
export class DeviceTokenGuard implements CanActivate {
  constructor(private readonly devicesService: DevicesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-device-token'];
    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedException('Header X-Device-Token ausente.');
    }
    const device = await this.devicesService.findActiveByToken(token);
    if (!device) {
      throw new UnauthorizedException('Token de dispositivo inválido ou dispositivo inativo.');
    }
    request.device = device;
    return true;
  }
}
