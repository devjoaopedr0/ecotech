/**
 * Regras dos sensores: calibração do sensor de umidade (valor bruto do ADC
 * → %) e alertas disparados pelas outras grandezas. Sem framework nem banco.
 */

export type SensorBoard = 'ARDUINO' | 'ESP32';

/** Valor máximo do conversor analógico de cada placa. */
export const BOARD_RESOLUTION: Record<SensorBoard, number> = { ARDUINO: 1023, ESP32: 4095 };

export interface Calibration {
  /** Leitura bruta com o sensor no ar (solo seco = 0%). */
  rawDry: number;
  /** Leitura bruta com o sensor na água (solo saturado = 100%). */
  rawWet: number;
}

/** Valores de partida típicos de um sensor capacitivo; o ideal é medir
 * cada sensor. */
export const DEFAULT_CALIBRATION: Record<SensorBoard, Calibration> = {
  ESP32: { rawDry: 3200, rawWet: 1300 },
  ARDUINO: { rawDry: 800, rawWet: 330 },
};

/** Calibração do dispositivo, ou a padrão da placa quando não foi feita. */
export function effectiveCalibration(device: {
  board: SensorBoard;
  rawDry: number | null;
  rawWet: number | null;
}): Calibration {
  if (device.rawDry === null || device.rawWet === null) return DEFAULT_CALIBRATION[device.board];
  return { rawDry: device.rawDry, rawWet: device.rawWet };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Converte a leitura bruta em % por interpolação linear (sensores
 * capacitivos leem mais alto quanto mais seco), com 2 casas decimais. */
export function rawToPercent(raw: number, c: Calibration): number {
  const span = c.rawDry - c.rawWet;
  if (span === 0) return 0;
  return Math.round(clamp(((c.rawDry - raw) / span) * 100, 0, 100) * 100) / 100;
}

/** Mensagem de erro, ou null se a calibração for válida para a placa. */
export function validateCalibration(board: SensorBoard, c: Calibration): string | null {
  const max = BOARD_RESOLUTION[board];
  if (![c.rawDry, c.rawWet].every((v) => Number.isInteger(v) && v >= 0 && v <= max)) {
    return `rawDry e rawWet devem ser inteiros entre 0 e ${max} para ${board}.`;
  }
  if (c.rawDry === c.rawWet) return 'rawDry e rawWet devem ser diferentes.';
  return null;
}

/** Uma placa sem leitura há mais que isso é considerada offline. */
export const OFFLINE_AFTER_MS = 5 * 60 * 1000;

export function isOnline(lastSeenAt: Date | null, now: Date): boolean {
  return lastSeenAt !== null && now.getTime() - lastSeenAt.getTime() <= OFFLINE_AFTER_MS;
}

export const RESERVOIR_LOW_PERCENT = 20;
export const HIGH_TEMPERATURE_C = 32;
/** Folha a esse tanto acima do ar indica possível estresse hídrico. */
export const WATER_STRESS_DELTA_C = 3;

export type EnvironmentAlertType = 'RESERVOIR_LOW' | 'HIGH_TEMPERATURE' | 'WATER_STRESS';

export interface EnvironmentValues {
  temperature?: number | null;
  leafTemperature?: number | null;
  waterLevel?: number | null;
}

/** Alertas das grandezas que não são umidade do solo. */
export function environmentAlerts(v: EnvironmentValues): { type: EnvironmentAlertType; value: number }[] {
  const out: { type: EnvironmentAlertType; value: number }[] = [];
  if (v.waterLevel != null && v.waterLevel < RESERVOIR_LOW_PERCENT) {
    out.push({ type: 'RESERVOIR_LOW', value: v.waterLevel });
  }
  if (v.temperature != null && v.temperature > HIGH_TEMPERATURE_C) {
    out.push({ type: 'HIGH_TEMPERATURE', value: v.temperature });
  }
  if (v.temperature != null && v.leafTemperature != null) {
    const delta = Math.round((v.leafTemperature - v.temperature) * 100) / 100;
    if (delta >= WATER_STRESS_DELTA_C) out.push({ type: 'WATER_STRESS', value: delta });
  }
  return out;
}
