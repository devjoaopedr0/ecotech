import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Device } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { validateCalibration } from '../domain/sensors';
import { PlantsService } from '../plants/plants.service';
import {
  CalibrationDto,
  CreateDeviceDto,
  DeviceResponseDto,
  DeviceWithTokenDto,
  UpdateDeviceDto,
} from './dto/device.dto';

export const DEVICE_TOKEN_PREFIX = 'etk_';

export function hashDeviceToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plantsService: PlantsService,
  ) {}

  async list(userId: string): Promise<DeviceResponseDto[]> {
    const devices = await this.prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return Promise.all(devices.map((device) => this.toResponse(device)));
  }

  async get(userId: string, deviceId: string): Promise<DeviceResponseDto> {
    return this.toResponse(await this.findOwned(userId, deviceId));
  }

  async create(userId: string, dto: CreateDeviceDto): Promise<DeviceWithTokenDto> {
    if (dto.plantId) await this.plantsService.findOwned(userId, dto.plantId);
    const token = generateToken();
    const device = await this.prisma.device.create({
      data: {
        userId,
        name: dto.name,
        macAddress: dto.macAddress?.toUpperCase() ?? null,
        location: dto.location ?? null,
        plantId: dto.plantId ?? null,
        board: dto.board,
        depthCm: dto.depthCm ?? null,
        position: dto.position ?? null,
        tokenHash: hashDeviceToken(token),
      },
    });
    return { ...DeviceResponseDto.from(device), token };
  }

  async update(userId: string, deviceId: string, dto: UpdateDeviceDto): Promise<DeviceResponseDto> {
    const device = await this.findOwned(userId, deviceId);
    if (dto.plantId) await this.plantsService.findOwned(userId, dto.plantId);
    const updated = await this.prisma.device.update({ where: { id: device.id }, data: dto });
    return this.toResponse(updated);
  }

  /** Grava a calibração seco/molhado. As próximas leituras brutas passam a
   * ser convertidas com ela; as já gravadas mantêm a % da época. */
  async calibrate(userId: string, deviceId: string, dto: CalibrationDto): Promise<DeviceResponseDto> {
    const device = await this.findOwned(userId, deviceId);
    const error = validateCalibration(dto.board, dto);
    if (error) throw new BadRequestException(error);
    const updated = await this.prisma.device.update({
      where: { id: device.id },
      data: { board: dto.board, rawDry: dto.rawDry, rawWet: dto.rawWet },
    });
    return this.toResponse(updated);
  }

  /** Gera um token novo; o anterior para de funcionar na hora. */
  async rotateToken(userId: string, deviceId: string): Promise<DeviceWithTokenDto> {
    const device = await this.findOwned(userId, deviceId);
    const token = generateToken();
    const updated = await this.prisma.device.update({
      where: { id: device.id },
      data: { tokenHash: hashDeviceToken(token) },
    });
    return { ...(await this.toResponse(updated)), token };
  }

  async remove(userId: string, deviceId: string): Promise<void> {
    const device = await this.findOwned(userId, deviceId);
    await this.prisma.device.delete({ where: { id: device.id } });
  }

  /** Usado pelo DeviceTokenGuard. */
  findActiveByToken(token: string): Promise<Device | null> {
    return this.prisma.device.findFirst({ where: { tokenHash: hashDeviceToken(token), active: true } });
  }

  private async toResponse(device: Device): Promise<DeviceResponseDto> {
    const latest = await this.prisma.reading.findFirst({
      where: { deviceId: device.id },
      orderBy: { createdAt: 'desc' },
    });
    return DeviceResponseDto.from(device, latest);
  }

  private async findOwned(userId: string, deviceId: string): Promise<Device> {
    const device = await this.prisma.device.findFirst({ where: { id: deviceId, userId } });
    if (!device) throw new NotFoundException('Dispositivo não encontrado.');
    return device;
  }
}

function generateToken(): string {
  return DEVICE_TOKEN_PREFIX + randomBytes(32).toString('base64url');
}
