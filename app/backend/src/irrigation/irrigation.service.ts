import { Injectable } from '@nestjs/common';
import { IrrigationEvent, IrrigationSettings, IrrigationSource, Plant, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  AUTO_MAX_MINUTES,
  autoIrrigationDecision,
  humidityStatus,
  irrigationReason,
  shouldStopCycle,
} from '../domain/humidity';
import { cycleLiters } from '../domain/water';
import { PlantsService } from '../plants/plants.service';
import { IrrigationEventDto, IrrigationSettingsDto, UpdateIrrigationSettingsDto } from './dto/irrigation.dto';

export interface ReadingDecision {
  isOn: boolean;
  /** Segundos até o ciclo atual ser encerrado à força (null = sem limite ou
   * desligada). O firmware usa para parar sozinho se perder a conexão. */
  maxRunSec: number | null;
}

@Injectable()
export class IrrigationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plantsService: PlantsService,
  ) {}

  async getSettings(userId: string, plantId: string): Promise<IrrigationSettingsDto> {
    const plant = await this.plantsService.findOwned(userId, plantId);
    return toSettingsDto(await this.ensureSettings(plant.id));
  }

  async updateSettings(userId: string, plantId: string, dto: UpdateIrrigationSettingsDto): Promise<IrrigationSettingsDto> {
    const plant = await this.plantsService.findOwned(userId, plantId);
    await this.ensureSettings(plant.id);
    const updated = await this.prisma.irrigationSettings.update({ where: { plantId: plant.id }, data: dto });
    return toSettingsDto(updated);
  }

  /**
   * Liga (opcionalmente por `durationMin` minutos) ou desliga manualmente.
   * Desligar com o solo ainda crítico bloqueia o modo automático até a
   * umidade sair do nível crítico, para ele não religar na leitura seguinte.
   */
  async setState(userId: string, plantId: string, on: boolean, durationMin?: number): Promise<IrrigationSettingsDto> {
    const plant = await this.plantsService.findOwned(userId, plantId);
    const humidity = await this.latestHumidity(plant.id);
    const settings = await this.switchTo(plant, on, IrrigationSource.MANUAL, humidity, durationMin ?? null);
    if (!on && humidity !== null && humidityStatus(humidity, plant) === 'CRITICAL' && !settings.autoBlocked) {
      return toSettingsDto(
        await this.prisma.irrigationSettings.update({ where: { plantId: plant.id }, data: { autoBlocked: true } }),
      );
    }
    return toSettingsDto(settings);
  }

  async listEvents(userId: string, plantId: string, limit: number): Promise<IrrigationEventDto[]> {
    const plant = await this.plantsService.findOwned(userId, plantId);
    const events = await this.prisma.irrigationEvent.findMany({
      where: { plantId: plant.id },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
    return events.map((e) => toEventDto(e, plant));
  }

  /** Ciclos de todas as plantas do usuário no intervalo (para relatórios). */
  async listAllEvents(userId: string, from: Date, to: Date, limit: number): Promise<IrrigationEventDto[]> {
    const plants = await this.prisma.plant.findMany({ where: { userId } });
    const byId = new Map(plants.map((p) => [p.id, p]));
    const events = await this.prisma.irrigationEvent.findMany({
      where: { plantId: { in: [...byId.keys()] }, startedAt: { gte: from, lte: to } },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
    return events.map((e) => toEventDto(e, byId.get(e.plantId)!));
  }

  /**
   * Chamado a cada leitura recebida. Encerra o ciclo aberto que passou do
   * tempo (ou do limite de umidade, no manual), libera o bloqueio do
   * automático quando o solo sai do nível crítico e, no modo AUTO, aplica a
   * regra de liga/desliga. Devolve o comando que volta para a placa.
   */
  async applyReading(plant: Plant, humidity: number | null): Promise<ReadingDecision> {
    let settings = await this.ensureSettings(plant.id);
    const now = new Date();
    const open = settings.isOn ? await this.openCycle(plant.id) : null;

    if (settings.autoBlocked && humidity !== null && humidityStatus(humidity, plant) !== 'CRITICAL') {
      settings = await this.prisma.irrigationSettings.update({ where: { plantId: plant.id }, data: { autoBlocked: false } });
    }

    if (open && shouldStopCycle(open, humidity, plant, now)) {
      await this.switchTo(plant, false, open.source, humidity, null);
      return { isOn: false, maxRunSec: null };
    }

    // Um ciclo manual aberto segue até a duração pedida ou até alguém desligar.
    if (settings.mode === 'AUTO' && humidity !== null && open?.source !== IrrigationSource.MANUAL) {
      const shouldBeOn = autoIrrigationDecision(humidity, plant, settings.isOn, settings.autoBlocked);
      if (shouldBeOn !== settings.isOn) {
        await this.switchTo(plant, shouldBeOn, IrrigationSource.AUTO, humidity, null);
        return { isOn: shouldBeOn, maxRunSec: shouldBeOn ? AUTO_MAX_MINUTES * 60 : null };
      }
    }

    return { isOn: settings.isOn, maxRunSec: open ? remainingSec(open, now) : null };
  }

  /** Muda o estado e mantém o histórico: ligar abre um ciclo, desligar
   * fecha o ciclo aberto com a umidade final e os litros. Repetir o estado
   * atual não gera ciclo. */
  private async switchTo(
    plant: Plant,
    on: boolean,
    source: IrrigationSource,
    humidity: number | null,
    plannedDurationMin: number | null,
  ): Promise<IrrigationSettings> {
    const settings = await this.ensureSettings(plant.id);
    if (settings.isOn === on) return settings;

    const now = new Date();
    const updateSettings = this.prisma.irrigationSettings.update({
      where: { plantId: plant.id },
      data: { isOn: on, ...(on ? { autoBlocked: false } : {}) },
    });

    if (on) {
      const [updated] = await this.prisma.$transaction([
        updateSettings,
        this.prisma.irrigationEvent.create({
          data: {
            plantId: plant.id,
            source,
            reason: irrigationReason(source, humidity, plant),
            plannedDurationMin,
            humidityBefore: humidity,
            startedAt: now,
          },
        }),
      ]);
      return updated;
    }

    const open = await this.openCycle(plant.id);
    const [updated] = await this.prisma.$transaction([
      updateSettings,
      ...(open
        ? [
            this.prisma.irrigationEvent.update({
              where: { id: open.id },
              data: {
                endedAt: now,
                humidityAfter: humidity,
                liters: cycleLiters(open.startedAt, now, Number(settings.flowRateLpm)),
              },
            }),
          ]
        : []),
    ]);
    return updated;
  }

  private openCycle(plantId: string): Promise<IrrigationEvent | null> {
    return this.prisma.irrigationEvent.findFirst({
      where: { plantId, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });
  }

  private async latestHumidity(plantId: string): Promise<number | null> {
    const reading = await this.prisma.reading.findFirst({
      where: { plantId, humidity: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { humidity: true },
    });
    return reading?.humidity == null ? null : Number(reading.humidity);
  }

  private ensureSettings(plantId: string): Promise<IrrigationSettings> {
    return this.prisma.irrigationSettings.upsert({
      where: { plantId },
      create: { plantId },
      update: {},
    });
  }
}

function remainingSec(cycle: IrrigationEvent, now: Date): number | null {
  const limitMin = cycle.source === IrrigationSource.AUTO ? AUTO_MAX_MINUTES : cycle.plannedDurationMin;
  if (limitMin === null) return null;
  const elapsedSec = (now.getTime() - cycle.startedAt.getTime()) / 1000;
  return Math.max(0, Math.round(limitMin * 60 - elapsedSec));
}

const toNumber = (value: Prisma.Decimal | number | null) => (value == null ? null : Number(value));

function toSettingsDto(s: IrrigationSettings): IrrigationSettingsDto {
  return { plantId: s.plantId, mode: s.mode, isOn: s.isOn, autoBlocked: s.autoBlocked, flowRateLpm: Number(s.flowRateLpm), updatedAt: s.updatedAt };
}

function toEventDto(e: IrrigationEvent, plant: Plant): IrrigationEventDto {
  return {
    id: e.id,
    plantId: e.plantId,
    plantName: plant.name,
    bed: plant.bed,
    source: e.source,
    reason: e.reason,
    plannedDurationMin: e.plannedDurationMin,
    durationMin: e.endedAt ? Math.round(((e.endedAt.getTime() - e.startedAt.getTime()) / 60_000) * 10) / 10 : null,
    humidityBefore: toNumber(e.humidityBefore),
    humidityAfter: toNumber(e.humidityAfter),
    liters: toNumber(e.liters),
    startedAt: e.startedAt,
    endedAt: e.endedAt,
  };
}
