import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { AlertType, Device, Plant } from '@prisma/client';
import { AlertCandidate, AlertsService } from '../alerts/alerts.service';
import { PrismaService } from '../database/prisma.service';
import { bucketize, computeStats, humidityStatus, Period, PERIOD_CONFIG, TimedValue } from '../domain/humidity';
import { BOARD_RESOLUTION, effectiveCalibration, environmentAlerts, rawToPercent } from '../domain/sensors';
import { IrrigationService } from '../irrigation/irrigation.service';
import { PlantsService } from '../plants/plants.service';
import { CollectedReadingDto, CreateReadingDto, IngestResultDto } from './dto/reading.dto';

const num = (value: unknown) => (value == null ? null : Number(value));

@Injectable()
export class ReadingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plantsService: PlantsService,
    private readonly irrigationService: IrrigationService,
    private readonly alertsService: AlertsService,
  ) {}

  /** Recebe a leitura da placa: converte o valor bruto pela calibração,
   * grava, atualiza o "visto por último", aplica a regra de irrigação e gera
   * os alertas. */
  async ingest(device: Device, dto: CreateReadingDto): Promise<IngestResultDto> {
    if (Object.values(dto).every((v) => v === undefined)) {
      throw new BadRequestException('Envie pelo menos uma grandeza.');
    }
    if (dto.rawValue !== undefined && dto.humidity !== undefined) {
      throw new BadRequestException('Envie rawValue ou humidity, não os dois.');
    }
    if (dto.rawValue !== undefined && dto.rawValue > BOARD_RESOLUTION[device.board]) {
      throw new BadRequestException(`rawValue deve ir até ${BOARD_RESOLUTION[device.board]} para ${device.board}.`);
    }
    const humidity =
      dto.rawValue !== undefined ? rawToPercent(dto.rawValue, effectiveCalibration(device)) : (dto.humidity ?? null);
    if (humidity !== null && !device.plantId) {
      throw new ConflictException('Dispositivo não está vinculado a nenhuma planta.');
    }
    const plant = device.plantId ? await this.plantsService.findOwned(device.userId, device.plantId) : null;

    const [reading] = await this.prisma.$transaction([
      this.prisma.reading.create({
        data: {
          plantId: plant?.id ?? null,
          deviceId: device.id,
          humidity,
          rawValue: dto.rawValue ?? null,
          temperature: dto.temperature ?? null,
          airHumidity: dto.airHumidity ?? null,
          leafTemperature: dto.leafTemperature ?? null,
          light: dto.light ?? null,
          waterLevel: dto.waterLevel ?? null,
        },
      }),
      this.prisma.device.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } }),
    ]);

    const status = plant && humidity !== null ? humidityStatus(humidity, plant) : null;
    const decision = plant ? await this.irrigationService.applyReading(plant, humidity) : { isOn: false, maxRunSec: null };
    await this.alertsService.raise(this.alertCandidates(device, plant, humidity, status, dto));

    return {
      readingId: reading.id,
      plantId: plant?.id ?? null,
      humidity,
      status,
      irrigation: decision.isOn ? 'ON' : 'OFF',
      maxRunSec: decision.maxRunSec,
    };
  }

  /** Leituras de todas as placas do usuário no intervalo, mais recentes
   * primeiro (coleta de dados e exportação). */
  async listAll(userId: string, from: Date, to: Date, limit: number): Promise<CollectedReadingDto[]> {
    const [plants, devices] = await Promise.all([
      this.prisma.plant.findMany({ where: { userId }, select: { id: true, name: true } }),
      this.prisma.device.findMany({ where: { userId }, select: { id: true, name: true } }),
    ]);
    const plantNames = new Map(plants.map((p) => [p.id, p.name]));
    const deviceNames = new Map(devices.map((d) => [d.id, d.name]));
    const rows = await this.prisma.reading.findMany({
      where: {
        OR: [{ plantId: { in: [...plantNames.keys()] } }, { deviceId: { in: [...deviceNames.keys()] } }],
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      plantId: r.plantId,
      plantName: r.plantId ? (plantNames.get(r.plantId) ?? null) : null,
      deviceId: r.deviceId,
      deviceName: r.deviceId ? (deviceNames.get(r.deviceId) ?? null) : null,
      humidity: num(r.humidity),
      rawValue: r.rawValue,
      temperature: num(r.temperature),
      createdAt: r.createdAt,
    }));
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
      humidityCritical: plant.humidityCritical,
      idealMin: plant.idealMin,
      idealMax: plant.idealMax,
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

  private alertCandidates(
    device: Device,
    plant: Plant | null,
    humidity: number | null,
    status: ReturnType<typeof humidityStatus> | null,
    dto: CreateReadingDto,
  ): AlertCandidate[] {
    const candidates: AlertCandidate[] = [];
    const humidityType = status ? AlertsService.humidityAlertType(status) : null;
    if (plant && humidity !== null && humidityType) {
      candidates.push({ userId: device.userId, plantId: plant.id, type: humidityType, value: humidity });
    }
    for (const alert of environmentAlerts(dto)) {
      // Reservatório é da placa; temperatura e estresse, da planta (se houver).
      const ofPlant = alert.type !== AlertType.RESERVOIR_LOW && plant;
      candidates.push({
        userId: device.userId,
        type: alert.type,
        value: alert.value,
        ...(ofPlant ? { plantId: plant.id } : { deviceId: device.id }),
      });
    }
    return candidates;
  }

  /** Leituras de umidade do período em ordem cronológica, com os valores em
   * number. */
  private async readingsInPeriod(
    plantId: string,
    period: Period,
  ): Promise<(TimedValue & { id: string; rawValue: number | null; temperature: number | null })[]> {
    const since = new Date(Date.now() - PERIOD_CONFIG[period].durationMs);
    const rows = await this.prisma.reading.findMany({
      where: { plantId, humidity: { not: null }, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, humidity: true, rawValue: true, temperature: true, createdAt: true },
    });
    return rows.map((r) => ({
      id: r.id,
      humidity: Number(r.humidity),
      rawValue: r.rawValue,
      temperature: num(r.temperature),
      createdAt: r.createdAt,
    }));
  }
}
