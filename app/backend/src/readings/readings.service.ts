import { ConflictException, Injectable } from '@nestjs/common';
import { Device } from '@prisma/client';
import { AlertsService } from '../alerts/alerts.service';
import { PrismaService } from '../database/prisma.service';
import {
  bucketize,
  computeStats,
  humidityStatus,
  HumidityStatus,
  Period,
  PERIOD_CONFIG,
  TimedValue,
} from '../domain/humidity';
import { IrrigationService } from '../irrigation/irrigation.service';
import { PlantsService } from '../plants/plants.service';

export interface IngestResult {
  readingId: string;
  plantId: string;
  humidity: number;
  status: HumidityStatus;
  /** Comando para o ESP32 aplicar na válvula/bomba. */
  irrigation: 'ON' | 'OFF';
}

@Injectable()
export class ReadingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plantsService: PlantsService,
    private readonly irrigationService: IrrigationService,
    private readonly alertsService: AlertsService,
  ) {}

  /** Recebe a leitura do sensor: grava, atualiza o "visto por último" do
   * dispositivo, aplica a regra de irrigação e gera alerta se for o caso. */
  async ingest(device: Device, humidity: number): Promise<IngestResult> {
    if (!device.plantId) {
      throw new ConflictException('Dispositivo não está vinculado a nenhuma planta.');
    }
    const plant = await this.plantsService.findOwned(device.userId, device.plantId);

    const [reading] = await this.prisma.$transaction([
      this.prisma.reading.create({ data: { plantId: plant.id, deviceId: device.id, humidity } }),
      this.prisma.device.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } }),
    ]);

    const status = humidityStatus(humidity, plant);
    const isOn = await this.irrigationService.applyReading(plant, humidity);
    await this.alertsService.raiseIfNeeded(plant, humidity, status);

    return { readingId: reading.id, plantId: plant.id, humidity, status, irrigation: isOn ? 'ON' : 'OFF' };
  }

  async list(userId: string, plantId: string, period: Period) {
    const plant = await this.plantsService.findOwned(userId, plantId);
    const readings = await this.readingsInPeriod(plant.id, period);
    return readings.reverse().map((r) => ({ ...r, status: humidityStatus(r.humidity, plant) }));
  }

  async history(userId: string, plantId: string, period: Period) {
    const plant = await this.plantsService.findOwned(userId, plantId);
    const readings = await this.readingsInPeriod(plant.id, period);
    return {
      period,
      bucketMs: PERIOD_CONFIG[period].bucketMs,
      humidityMin: plant.humidityMin,
      humidityMax: plant.humidityMax,
      buckets: bucketize(readings, PERIOD_CONFIG[period].bucketMs),
    };
  }

  async stats(userId: string, plantId: string, period: Period) {
    const plant = await this.plantsService.findOwned(userId, plantId);
    const readings = await this.readingsInPeriod(plant.id, period);
    const stats = computeStats(readings);
    return {
      period,
      ...stats,
      status: stats.current === null ? null : humidityStatus(stats.current, plant),
    };
  }

  /** Leituras do período em ordem cronológica, com a umidade já em number. */
  private async readingsInPeriod(plantId: string, period: Period): Promise<(TimedValue & { id: string })[]> {
    const since = new Date(Date.now() - PERIOD_CONFIG[period].durationMs);
    const rows = await this.prisma.reading.findMany({
      where: { plantId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, humidity: true, createdAt: true },
    });
    return rows.map((r) => ({ id: r.id, humidity: Number(r.humidity), createdAt: r.createdAt }));
  }
}
