import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Crop } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateCropDto, CropResponseDto, UpdateCropDto } from './dto/crop.dto';

@Injectable()
export class CropsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOwned(userId: string, cropId: string): Promise<Crop> {
    const crop = await this.prisma.crop.findFirst({ where: { id: cropId, userId } });
    if (!crop) throw new NotFoundException('Cultura não encontrada.');
    return crop;
  }

  async list(userId: string): Promise<CropResponseDto[]> {
    const crops = await this.prisma.crop.findMany({ where: { userId }, orderBy: { name: 'asc' } });
    return crops.map(CropResponseDto.from);
  }

  async create(userId: string, dto: CreateCropDto): Promise<CropResponseDto> {
    assertRanges(dto);
    await this.assertUniqueName(userId, dto.name);
    return CropResponseDto.from(await this.prisma.crop.create({ data: { userId, ...dto } }));
  }

  async update(userId: string, cropId: string, dto: UpdateCropDto): Promise<CropResponseDto> {
    const crop = await this.findOwned(userId, cropId);
    assertRanges({ ...CropResponseDto.from(crop), ...dto });
    if (dto.name && dto.name !== crop.name) await this.assertUniqueName(userId, dto.name);
    return CropResponseDto.from(await this.prisma.crop.update({ where: { id: crop.id }, data: dto }));
  }

  /** As plantas da cultura ficam sem cultura (FK com SET NULL). */
  async remove(userId: string, cropId: string): Promise<void> {
    const crop = await this.findOwned(userId, cropId);
    await this.prisma.crop.delete({ where: { id: crop.id } });
  }

  private async assertUniqueName(userId: string, name: string): Promise<void> {
    if (await this.prisma.crop.findFirst({ where: { userId, name } })) {
      throw new ConflictException('Já existe uma cultura com este nome.');
    }
  }
}

function assertRanges(c: { temperatureMin: number; temperatureMax: number; lightMin: number; lightMax: number }) {
  if (c.temperatureMin >= c.temperatureMax) {
    throw new BadRequestException('temperatureMin deve ser menor que temperatureMax.');
  }
  if (c.lightMin >= c.lightMax) throw new BadRequestException('lightMin deve ser menor que lightMax.');
}
