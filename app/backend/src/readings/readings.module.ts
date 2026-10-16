import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { DevicesModule } from '../devices/devices.module';
import { IrrigationModule } from '../irrigation/irrigation.module';
import { PlantsModule } from '../plants/plants.module';
import { ReadingsController } from './readings.controller';
import { ReadingsService } from './readings.service';

@Module({
  imports: [PlantsModule, DevicesModule, IrrigationModule, AlertsModule],
  controllers: [ReadingsController],
  providers: [ReadingsService],
})
export class ReadingsModule {}
