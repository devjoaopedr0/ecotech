import { Injectable, NotFoundException } from '@nestjs/common';
import { Alert, AlertType, Plant } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { HumidityStatus } from '../domain/humidity';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, unreadOnly: boolean, limit: number): Promise<Alert[]> {
    return this.prisma.alert.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markRead(userId: string, alertId: string): Promise<Alert> {
    const alert = await this.prisma.alert.findFirst({ where: { id: alertId, userId } });
    if (!alert) throw new NotFoundException('Alerta não encontrado.');
    if (alert.readAt) return alert;
    return this.prisma.alert.update({ where: { id: alert.id }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string): Promise<{ count: number }> {
    return this.prisma.alert.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /** Cria um alerta quando a leitura sai da faixa. Enquanto houver um alerta
   * não lido do mesmo tipo para a planta, não cria outro, para uma planta
   * seca não gerar um alerta a cada 10 segundos. Respeita a preferência
   * "horta" do usuário. */
  async raiseIfNeeded(plant: Plant, humidity: number, status: HumidityStatus): Promise<Alert | null> {
    if (status !== 'LOW' && status !== 'HIGH') return null;
    const type = status === 'LOW' ? AlertType.LOW : AlertType.HIGH;

    const preference = await this.prisma.notificationPreference.findUnique({
      where: { userId: plant.userId },
    });
    if (preference && !preference.garden) return null;

    const pending = await this.prisma.alert.findFirst({
      where: { plantId: plant.id, type, readAt: null },
    });
    if (pending) return null;

    return this.prisma.alert.create({
      data: { userId: plant.userId, plantId: plant.id, type, humidity },
    });
  }
}
