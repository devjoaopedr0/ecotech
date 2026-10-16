import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { conventionalDailyLiters, localDate, summarizeWater } from '../domain/water';
import { WaterDayDto, WaterReportDto } from './dto/report.dto';

export const DEFAULT_WATER_TARIFF_PER_M3 = 6.48;

const HOUR = 60 * 60 * 1000;
const round2 = (value: number) => Math.round(value * 100) / 100;

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /** Consumo, economia e indicadores da horta por dia local (no fuso `tz`). */
  async water(userId: string, from: Date, to: Date, tz: string): Promise<WaterReportDto> {
    const tariffPerM3 = this.configService.get<number>('WATER_TARIFF_PER_M3') ?? DEFAULT_WATER_TARIFF_PER_M3;
    const plants = await this.prisma.plant.findMany({ where: { userId } });
    const plantIds = plants.map((p) => p.id);

    const [crops, settings, events, readings, alerts] = await Promise.all([
      this.prisma.crop.findMany({ where: { userId } }),
      this.prisma.irrigationSettings.findMany({ where: { plantId: { in: plantIds } } }),
      this.prisma.irrigationEvent.findMany({
        where: { plantId: { in: plantIds }, startedAt: { gte: from, lte: to } },
      }),
      this.prisma.reading.findMany({
        where: { plantId: { in: plantIds }, humidity: { not: null }, createdAt: { gte: from, lte: to } },
        select: { plantId: true, humidity: true, createdAt: true },
      }),
      this.prisma.alert.findMany({ where: { userId, createdAt: { gte: from, lte: to } }, select: { createdAt: true } }),
    ]);

    const irrigationsPerDay = new Map(crops.map((c) => [c.id, Number(c.irrigationsPerDay)]));
    const flowRate = new Map(settings.map((s) => [s.plantId, Number(s.flowRateLpm)]));
    const critical = new Map(plants.map((p) => [p.id, p.humidityCritical]));
    const days = new Map<string, { used: number; conventional: number; humidity: number[]; critical: Set<string>; alerts: number }>();
    for (let t = from.getTime(); t < to.getTime(); t += HOUR) {
      const date = localDate(new Date(t), tz);
      if (days.has(date)) continue;
      const conventional = plants
        .filter((p) => localDate(p.createdAt, tz) <= date)
        .reduce(
          (sum, p) => sum + conventionalDailyLiters(p.cropId ? (irrigationsPerDay.get(p.cropId) ?? null) : null, flowRate.get(p.id) ?? 2),
          0,
        );
      days.set(date, { used: 0, conventional, humidity: [], critical: new Set(), alerts: 0 });
    }

    for (const e of events) days.get(localDate(e.startedAt, tz))!.used += Number(e.liters ?? 0);
    for (const r of readings) {
      const day = days.get(localDate(r.createdAt, tz))!;
      const humidity = Number(r.humidity);
      day.humidity.push(humidity);
      if (humidity < critical.get(r.plantId!)!) day.critical.add(r.plantId!);
    }
    for (const a of alerts) days.get(localDate(a.createdAt, tz))!.alerts += 1;

    const rows: WaterDayDto[] = [...days.entries()].map(([date, d]) => ({
      date,
      usedLiters: round2(d.used),
      conventionalLiters: round2(d.conventional),
      avgHumidity: d.humidity.length ? round2(d.humidity.reduce((s, v) => s + v, 0) / d.humidity.length) : null,
      criticalPlants: d.critical.size,
      alerts: d.alerts,
    }));
    const used = rows.reduce((s, r) => s + r.usedLiters, 0);
    const conventional = rows.reduce((s, r) => s + r.conventionalLiters, 0);

    return { from, to, tz, tariffPerM3, days: rows, summary: summarizeWater(used, conventional, tariffPerM3) };
  }
}
