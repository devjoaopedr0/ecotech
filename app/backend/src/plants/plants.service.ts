import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Plant, Prisma } from '@prisma/client';
import { CatalogService } from '../catalog/catalog.service';
import { CropsService } from '../crops/crops.service';
import { PrismaService } from '../database/prisma.service';
import {
  deriveThresholds,
  DRYING_WINDOW_MS,
  dryingRatePerHour,
  HumidityThresholds,
  humidityStatus,
  validateThresholds,
} from '../domain/humidity';
import { CreatePlantDto, PlantResponseDto, UpdatePlantDto } from './dto/plant.dto';

const THRESHOLD_KEYS = ['humidityCritical', 'humidityLow', 'idealMin', 'idealMax', 'humidityHigh'] as const;

@Injectable()
export class PlantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogService: CatalogService,
    private readonly cropsService: CropsService,
  ) {}

  /** Busca uma planta do usuário. Planta de outro usuário dá o mesmo 404 de
   * planta inexistente, para não revelar ids alheios. */
  async findOwned(userId: string, plantId: string): Promise<Plant> {
    const plant = await this.prisma.plant.findFirst({ where: { id: plantId, userId } });
    if (!plant) throw new NotFoundException('Planta não encontrada.');
    return plant;
  }

  async list(userId: string): Promise<PlantResponseDto[]> {
    const plants = await this.prisma.plant.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return Promise.all(plants.map((plant) => this.toResponse(plant)));
  }

  async get(userId: string, plantId: string): Promise<PlantResponseDto> {
    return this.toResponse(await this.findOwned(userId, plantId));
  }

  async create(userId: string, dto: CreatePlantDto): Promise<PlantResponseDto> {
    const catalog = dto.catalogPlantId ? await this.catalogService.findById(dto.catalogPlantId) : null;
    if (dto.catalogPlantId && !catalog) {
      throw new BadRequestException('Planta do catálogo não encontrada.');
    }
    if (dto.cropId) await this.cropsService.findOwned(userId, dto.cropId);

    const name = dto.name ?? catalog?.popularName;
    const idealMin = dto.idealMin ?? catalog?.humidityMin;
    const idealMax = dto.idealMax ?? catalog?.humidityMax;
    if (!name || idealMin === undefined || idealMax === undefined) {
      throw new BadRequestException('Informe name, idealMin e idealMax, ou escolha uma planta do catálogo.');
    }
    const thresholds = assertThresholds({ ...deriveThresholds(idealMin, idealMax), ...pickThresholds(dto) });

    const plant = await this.prisma.plant.create({
      data: {
        userId,
        catalogPlantId: catalog?.id ?? null,
        cropId: dto.cropId ?? null,
        name,
        species: dto.species ?? catalog?.scientificName ?? null,
        emoji: dto.emoji,
        location: dto.location ?? null,
        bed: dto.bed ?? null,
        plantedAt: toDate(dto.plantedAt) ?? null,
        ...thresholds,
      },
    });
    return this.toResponse(plant);
  }

  async update(userId: string, plantId: string, dto: UpdatePlantDto): Promise<PlantResponseDto> {
    const plant = await this.findOwned(userId, plantId);
    if (dto.catalogPlantId && !(await this.catalogService.findById(dto.catalogPlantId))) {
      throw new BadRequestException('Planta do catálogo não encontrada.');
    }
    if (dto.cropId) await this.cropsService.findOwned(userId, dto.cropId);
    assertThresholds({ ...pickThresholds(plant), ...pickThresholds(dto) });

    const { plantedAt, ...rest } = dto;
    const data: Prisma.PlantUncheckedUpdateInput = { ...rest };
    if (plantedAt !== undefined) data.plantedAt = toDate(plantedAt);
    const updated = await this.prisma.plant.update({ where: { id: plant.id }, data });
    return this.toResponse(updated);
  }

  async remove(userId: string, plantId: string): Promise<void> {
    const plant = await this.findOwned(userId, plantId);
    await this.prisma.plant.delete({ where: { id: plant.id } });
  }

  async toResponse(plant: Plant): Promise<PlantResponseDto> {
    const [latest, latestTemperature, recent, settings, lastEvent] = await Promise.all([
      this.prisma.reading.findFirst({
        where: { plantId: plant.id, humidity: { not: null } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reading.findFirst({
        where: { plantId: plant.id, temperature: { not: null } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reading.findMany({
        where: {
          plantId: plant.id,
          humidity: { not: null },
          createdAt: { gte: new Date(Date.now() - DRYING_WINDOW_MS) },
        },
        orderBy: { createdAt: 'asc' },
        select: { humidity: true, createdAt: true },
      }),
      this.prisma.irrigationSettings.findUnique({ where: { plantId: plant.id } }),
      this.prisma.irrigationEvent.findFirst({
        where: { plantId: plant.id },
        orderBy: { startedAt: 'desc' },
      }),
    ]);
    const humidity = latest?.humidity == null ? null : Number(latest.humidity);
    const isOn = settings?.isOn ?? false;
    const openCycle = isOn && lastEvent && !lastEvent.endedAt ? lastEvent : null;

    return {
      id: plant.id,
      name: plant.name,
      species: plant.species,
      emoji: plant.emoji,
      location: plant.location,
      bed: plant.bed,
      plantedAt: plant.plantedAt ? plant.plantedAt.toISOString().slice(0, 10) : null,
      cropId: plant.cropId,
      catalogPlantId: plant.catalogPlantId,
      humidityCritical: plant.humidityCritical,
      humidityLow: plant.humidityLow,
      idealMin: plant.idealMin,
      idealMax: plant.idealMax,
      humidityHigh: plant.humidityHigh,
      createdAt: plant.createdAt,
      latestReading: latest && humidity !== null ? { humidity, createdAt: latest.createdAt } : null,
      temperature: latestTemperature?.temperature == null ? null : Number(latestTemperature.temperature),
      status: humidity === null ? null : humidityStatus(humidity, plant),
      dryingRatePerHour: dryingRatePerHour(
        recent.map((r) => ({ humidity: Number(r.humidity), createdAt: r.createdAt })),
      ),
      irrigation: {
        mode: settings?.mode ?? 'MANUAL',
        isOn,
        autoBlocked: settings?.autoBlocked ?? false,
        flowRateLpm: settings ? Number(settings.flowRateLpm) : 2,
        lastIrrigationAt: lastEvent?.startedAt ?? null,
        currentCycle: openCycle
          ? {
              source: openCycle.source,
              reason: openCycle.reason,
              startedAt: openCycle.startedAt,
              plannedDurationMin: openCycle.plannedDurationMin,
              humidityBefore: openCycle.humidityBefore == null ? null : Number(openCycle.humidityBefore),
            }
          : null,
      },
    };
  }
}

function pickThresholds(source: Partial<HumidityThresholds>): Partial<HumidityThresholds> {
  return Object.fromEntries(THRESHOLD_KEYS.filter((k) => source[k] !== undefined).map((k) => [k, source[k]]));
}

function assertThresholds(t: Partial<HumidityThresholds>): HumidityThresholds {
  const error = validateThresholds(t as HumidityThresholds);
  if (error) throw new BadRequestException(error);
  return t as HumidityThresholds;
}

/** "AAAA-MM-DD" → Date à meia-noite UTC (coluna DATE, sem fuso). */
function toDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined || value === null) return value;
  return new Date(`${value}T00:00:00.000Z`);
}
