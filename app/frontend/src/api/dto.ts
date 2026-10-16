/**
 * Formato das respostas do backend (app/backend). Espelha os DTOs do NestJS;
 * as telas não usam estes tipos diretamente: `mappers.ts` converte para os
 * modelos de `src/types`.
 */

export type HumidityStatusDto = 'CRITICAL' | 'LOW' | 'IDEAL' | 'HIGH';
export type IrrigationModeDto = 'AUTO' | 'MANUAL';
export type IrrigationSourceDto = 'AUTO' | 'MANUAL';
export type SensorBoardDto = 'ARDUINO' | 'ESP32';

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface NotificationPreferenceDto {
  garden: boolean;
  email: boolean;
  system: boolean;
}

export interface PlantDto {
  id: string;
  name: string;
  species: string | null;
  emoji: string;
  location: string | null;
  bed: string | null;
  plantedAt: string | null;
  cropId: string | null;
  catalogPlantId: string | null;
  humidityCritical: number;
  humidityLow: number;
  idealMin: number;
  idealMax: number;
  humidityHigh: number;
  createdAt: string;
  latestReading: { humidity: number; createdAt: string } | null;
  temperature: number | null;
  status: HumidityStatusDto | null;
  dryingRatePerHour: number | null;
  irrigation: {
    mode: IrrigationModeDto;
    isOn: boolean;
    autoBlocked: boolean;
    flowRateLpm: number;
    lastIrrigationAt: string | null;
    currentCycle: {
      source: IrrigationSourceDto;
      reason: string;
      startedAt: string;
      plannedDurationMin: number | null;
      humidityBefore: number | null;
    } | null;
  };
}

/** Campos aceitos no POST/PATCH /plants. */
export interface PlantInputDto {
  name?: string;
  species?: string;
  emoji?: string;
  location?: string;
  bed?: string;
  plantedAt?: string | null;
  cropId?: string | null;
  humidityCritical?: number;
  humidityLow?: number;
  idealMin?: number;
  idealMax?: number;
  humidityHigh?: number;
}

export interface CropDto {
  id: string;
  name: string;
  temperatureMin: number;
  temperatureMax: number;
  lightMin: number;
  lightMax: number;
  irrigationsPerDay: number;
  cycleDays: number;
}

export interface DeviceDto {
  id: string;
  name: string;
  macAddress: string | null;
  location: string | null;
  active: boolean;
  plantId: string | null;
  board: SensorBoardDto;
  calibration: { rawDry: number; rawWet: number; isDefault: boolean };
  depthCm: number | null;
  position: string | null;
  online: boolean;
  lastSeenAt: string | null;
  latestReading: {
    humidity: number | null;
    rawValue: number | null;
    temperature: number | null;
    airHumidity: number | null;
    leafTemperature: number | null;
    light: number | null;
    waterLevel: number | null;
    createdAt: string;
  } | null;
  createdAt: string;
}

export interface IrrigationEventDto {
  id: string;
  plantId: string;
  plantName: string;
  bed: string | null;
  source: IrrigationSourceDto;
  reason: string;
  plannedDurationMin: number | null;
  durationMin: number | null;
  humidityBefore: number | null;
  humidityAfter: number | null;
  liters: number | null;
  startedAt: string;
  endedAt: string | null;
}

export interface WaterReportDto {
  from: string;
  to: string;
  tz: string;
  tariffPerM3: number;
  days: {
    date: string;
    usedLiters: number;
    conventionalLiters: number;
    avgHumidity: number | null;
    criticalPlants: number;
    alerts: number;
  }[];
  summary: {
    usedLiters: number;
    conventionalLiters: number;
    savedLiters: number;
    savingPercent: number;
    cost: number;
    savedCost: number;
  };
}

export interface CollectedReadingDto {
  id: string;
  plantId: string | null;
  plantName: string | null;
  deviceId: string | null;
  deviceName: string | null;
  humidity: number | null;
  rawValue: number | null;
  temperature: number | null;
  createdAt: string;
}

/** Corpo de erro do filtro global do backend. */
export interface ErrorBodyDto {
  statusCode: number;
  message: string | string[];
  error: string;
}
