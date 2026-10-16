import { Injectable, NotFoundException } from '@nestjs/common';
import { Alert, AlertType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { HumidityStatus } from '../domain/humidity';
import { AlertResponseDto } from './dto/alert.dto';

export interface AlertCandidate {
  userId: string;
  type: AlertType;
  value: number;
  /** Alertas de umidade, temperatura e estresse são da planta; o de
   * reservatório é da placa. */
  plantId?: string | null;
  deviceId?: string | null;
}

const HUMIDITY_ALERT: Partial<Record<HumidityStatus, AlertType>> = {
  CRITICAL: AlertType.CRITICAL,
  LOW: AlertType.LOW,
  HIGH: AlertType.HIGH,
};

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, unreadOnly: boolean, limit: number): Promise<AlertResponseDto[]> {
    const alerts = await this.prisma.alert.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return alerts.map(AlertResponseDto.from);
  }

  async markRead(userId: string, alertId: string): Promise<AlertResponseDto> {
    const alert = await this.prisma.alert.findFirst({ where: { id: alertId, userId } });
    if (!alert) throw new NotFoundException('Alerta não encontrado.');
    if (alert.readAt) return AlertResponseDto.from(alert);
    return AlertResponseDto.from(
      await this.prisma.alert.update({ where: { id: alert.id }, data: { readAt: new Date() } }),
    );
  }

  async markAllRead(userId: string): Promise<{ count: number }> {
    return this.prisma.alert.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /** Tipo de alerta de umidade para o status, ou null se não houver. */
  static humidityAlertType(status: HumidityStatus): AlertType | null {
    return HUMIDITY_ALERT[status] ?? null;
  }

  /**
   * Cria os alertas ainda não pendentes. Enquanto houver um alerta não lido
   * do mesmo tipo para a mesma planta (ou placa), não cria outro, para uma
   * planta seca não gerar um alerta a cada leitura. Respeita a preferência
   * "horta" do usuário.
   */
  async raise(candidates: AlertCandidate[]): Promise<Alert[]> {
    if (candidates.length === 0) return [];
    const preference = await this.prisma.notificationPreference.findUnique({
      where: { userId: candidates[0].userId },
    });
    if (preference && !preference.garden) return [];

    const created: Alert[] = [];
    for (const c of candidates) {
      const scope = c.plantId ? { plantId: c.plantId } : { deviceId: c.deviceId ?? null, plantId: null };
      const pending = await this.prisma.alert.findFirst({ where: { ...scope, type: c.type, readAt: null } });
      if (pending) continue;
      created.push(
        await this.prisma.alert.create({
          data: { userId: c.userId, plantId: c.plantId ?? null, deviceId: c.deviceId ?? null, type: c.type, value: c.value },
        }),
      );
    }
    return created;
  }
}
