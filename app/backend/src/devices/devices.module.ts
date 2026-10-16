import { Module } from '@nestjs/common';
import { PlantsModule } from '../plants/plants.module';
import { DeviceTokenGuard } from './device-token.guard';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

@Module({
  imports: [PlantsModule],
  controllers: [DevicesController],
  providers: [DevicesService, DeviceTokenGuard],
  exports: [DevicesService, DeviceTokenGuard],
})
export class DevicesModule {}
