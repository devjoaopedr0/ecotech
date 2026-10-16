import { Module } from '@nestjs/common';
import { PlantsModule } from '../plants/plants.module';
import { IrrigationController, IrrigationHistoryController } from './irrigation.controller';
import { IrrigationService } from './irrigation.service';

@Module({
  imports: [PlantsModule],
  controllers: [IrrigationController, IrrigationHistoryController],
  providers: [IrrigationService],
  exports: [IrrigationService],
})
export class IrrigationModule {}
