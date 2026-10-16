import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Device } from '@prisma/client';

/** Dispositivo autenticado pelo DeviceTokenGuard: `@CurrentDevice() device: Device`. */
export const CurrentDevice = createParamDecorator((_data: unknown, ctx: ExecutionContext): Device => {
  return ctx.switchToHttp().getRequest().device;
});
