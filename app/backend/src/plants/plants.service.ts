import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Plant } from '@prisma/client';
import { CatalogService } from '../catalog/catalog.service';
import { PrismaService } from '../database/prisma.service';
import { humidityStatus } from '../domain/humidity';
import { CreatePlantDto, PlantResponseDto, UpdatePlantDto } from './dto/plant.dto';

@Injectable()
export class PlantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogService: CatalogService,
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

    const name = dto.name ?? catalog?.popularName;
    const humidityMin = dto.humidityMin ?? catalog?.humidityMin;
    const humidityMax = dto.humidityMax ?? catalog?.humidityMax;
    if (!name || humidityMin === undefined || humidityMax === undefined) {
      throw new BadRequestException(
        'Informe name, humidityMin e humidityMax, ou escolha uma planta do catálogo.',
      );
    }
    assertRange(humidityMin, humidityMax);

    const plant = await this.prisma.plant.create({
      data: {
        userId,
        catalogPlantId: catalog?.id ?? null,
        name,
        species: dto.species ?? catalog?.scientificName ?? null,
        emoji: dto.emoji,
        location: dto.location ?? null,
        humidityMin,
        humidityMax,
      },
    });
    return this.toResponse(plant);
  }

  async update(userId: string, plantId: string, dto: UpdatePlantDto): Promise<PlantResponseDto> {
    const plant = await this.findOwned(userId, plantId);
    if (dto.catalogPlantId && !(await this.catalogService.findById(dto.catalogPlantId))) {
      throw new BadRequestException('Planta do catálogo não encontrada.');
    }
    assertRange(dto.humidityMin ?? plant.humidityMin, dto.humidityMax ?? plant.humidityMax);

    const updated = await this.prisma.plant.update({ where: { id: plant.id }, data: dto });
    return this.toResponse(updated);
  }

  async remove(userId: string, plantId: string): Promise<void> {
    const plant = await this.findOwned(userId, plantId);
    await this.prisma.plant.delete({ where: { id: plant.id } });
  }

  private async toResponse(plant: Plant): Promise<PlantResponseDto> {
    const [latest, settings, lastEvent] = await Promise.all([
      this.prisma.reading.findFirst({ where: { plantId: plant.id }, orderBy: { createdAt: 'desc' } }),
      this.prisma.irrigationSettings.findUnique({ where: { plantId: plant.id } }),
      this.prisma.irrigationEvent.findFirst({
        where: { plantId: plant.id },
        orderBy: { startedAt: 'desc' },
      }),
    ]);
    const humidity = latest ? Number(latest.humidity) : null;

    return {
      id: plant.id,
      name: plant.name,
      species: plant.species,
      emoji: plant.emoji,
      location: plant.location,
      humidityMin: plant.humidityMin,
      humidityMax: plant.humidityMax,
      catalogPlantId: plant.catalogPlantId,
      createdAt: plant.createdAt,
      latestReading: latest ? { humidity: humidity as number, createdAt: latest.createdAt } : null,
      status: humidity === null ? null : humidityStatus(humidity, plant),
      irrigation: {
        mode: settings?.mode ?? 'MANUAL',
        isOn: settings?.isOn ?? false,
        lastIrrigationAt: lastEvent?.startedAt ?? null,
      },
    };
  }
}

function assertRange(min: number, max: number): void {
  if (min >= max) {
    throw new BadRequestException('humidityMin deve ser menor que humidityMax.');
  }
}
