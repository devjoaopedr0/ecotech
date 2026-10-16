import { Injectable } from '@nestjs/common';
import { IrrigationMode, IrrigationSettings, IrrigationSource, Plant } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { autoIrrigationDecision } from '../domain/humidity';
import { PlantsService } from '../plants/plants.service';

@Injectable()
export class IrrigationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plantsService: PlantsService,
  ) {}

  async getSettings(userId: string, plantId: string): Promise<IrrigationSettings> {
    const plant = await this.plantsService.findOwned(userId, plantId);
    return this.ensureSettings(plant.id);
  }

  async setMode(userId: string, plantId: string, mode: IrrigationMode): Promise<IrrigationSettings> {
    const plant = await this.plantsService.findOwned(userId, plantId);
    await this.ensureSettings(plant.id);
    return this.prisma.irrigationSettings.update({ where: { plantId: plant.id }, data: { mode } });
  }

  /** Liga ou desliga manualmente. No modo automático, a próxima leitura do
   * sensor pode reverter a escolha; para controle manual de verdade, mude o
   * modo para MANUAL. */
  async setState(userId: string, plantId: string, on: boolean): Promise<IrrigationSettings> {
    const plant = await this.plantsService.findOwned(userId, plantId);
    return this.switchTo(plant.id, on, IrrigationSource.MANUAL);
  }

  async listEvents(userId: string, plantId: string, limit: number) {
    const plant = await this.plantsService.findOwned(userId, plantId);
    return this.prisma.irrigationEvent.findMany({
      where: { plantId: plant.id },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  /** Chamado a cada leitura recebida. No modo AUTO, aplica a regra de
   * liga/desliga; devolve se a irrigação deve ficar ligada (o comando que
   * volta para o ESP32). */
  async applyReading(plant: Plant, humidity: number): Promise<boolean> {
    const settings = await this.ensureSettings(plant.id);
    if (settings.mode !== IrrigationMode.AUTO) return settings.isOn;

    const shouldBeOn = autoIrrigationDecision(humidity, plant, settings.isOn);
    if (shouldBeOn !== settings.isOn) {
      await this.switchTo(plant.id, shouldBeOn, IrrigationSource.AUTO);
    }
    return shouldBeOn;
  }

  /** Muda o estado e mantém o histórico: ligar abre um evento, desligar fecha
   * o evento aberto. Repetir o estado atual não gera evento. */
  private async switchTo(plantId: string, on: boolean, source: IrrigationSource): Promise<IrrigationSettings> {
    const settings = await this.ensureSettings(plantId);
    if (settings.isOn === on) return settings;

    const now = new Date();
    const [updated] = await this.prisma.$transaction([
      this.prisma.irrigationSettings.update({ where: { plantId }, data: { isOn: on } }),
      on
        ? this.prisma.irrigationEvent.create({ data: { plantId, source, startedAt: now } })
        : this.prisma.irrigationEvent.updateMany({
            where: { plantId, endedAt: null },
            data: { endedAt: now },
          }),
    ]);
    return updated;
  }

  private ensureSettings(plantId: string): Promise<IrrigationSettings> {
    return this.prisma.irrigationSettings.upsert({
      where: { plantId },
      create: { plantId },
      update: {},
    });
  }
}
