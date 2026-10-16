/**
 * Regras de negócio da umidade do solo, sem dependência de framework ou
 * banco, para poderem ser testadas isoladamente.
 */

export type HumidityStatus = 'CRITICAL' | 'LOW' | 'IDEAL' | 'HIGH';

/**
 * Limites de umidade de uma planta, em %. Ordem obrigatória:
 * humidityCritical < humidityLow <= idealMin < idealMax <= humidityHigh.
 */
export interface HumidityThresholds {
  humidityCritical: number;
  humidityLow: number;
  idealMin: number;
  idealMax: number;
  humidityHigh: number;
}

/** Abaixo da crítica é CRITICAL, abaixo da mínima é LOW, acima da máxima é
 * HIGH e no resto é IDEAL. */
export function humidityStatus(humidity: number, t: HumidityThresholds): HumidityStatus {
  if (humidity < t.humidityCritical) return 'CRITICAL';
  if (humidity < t.humidityLow) return 'LOW';
  if (humidity > t.humidityHigh) return 'HIGH';
  return 'IDEAL';
}

/** Limites padrão a partir da faixa ideal (ex.: a do catálogo): mínima 5
 * pontos abaixo, máxima 10 acima e crítica 5 abaixo da mínima. */
export function deriveThresholds(idealMin: number, idealMax: number): HumidityThresholds {
  const humidityLow = Math.max(idealMin - 5, 1);
  return {
    humidityCritical: Math.max(humidityLow - 5, 0),
    humidityLow,
    idealMin,
    idealMax,
    humidityHigh: Math.min(idealMax + 10, 100),
  };
}

/** Mensagem de erro, ou null se os limites forem coerentes. */
export function validateThresholds(t: HumidityThresholds): string | null {
  const values = [t.humidityCritical, t.humidityLow, t.idealMin, t.idealMax, t.humidityHigh];
  if (values.some((v) => !Number.isInteger(v) || v < 0 || v > 100)) {
    return 'Os limites de umidade devem ser inteiros entre 0 e 100.';
  }
  if (t.humidityCritical >= t.humidityLow) return 'humidityCritical deve ser menor que humidityLow.';
  if (t.humidityLow > t.idealMin) return 'humidityLow não pode ser maior que idealMin.';
  if (t.idealMin >= t.idealMax) return 'idealMin deve ser menor que idealMax.';
  if (t.idealMax > t.humidityHigh) return 'humidityHigh não pode ser menor que idealMax.';
  return null;
}

/** Tempo máximo de um ciclo automático, para um sensor com defeito não
 * deixar a bomba ligada indefinidamente. */
export const AUTO_MAX_MINUTES = 20;

/**
 * Modo automático: liga quando a umidade fica crítica e mantém ligada até a
 * umidade chegar ao início da faixa ideal. A distância entre os dois
 * limites evita liga-desliga a cada leitura. Com `autoBlocked` (o usuário
 * desligou com o solo ainda crítico), não religa sozinho.
 */
export function autoIrrigationDecision(
  humidity: number,
  t: HumidityThresholds,
  isOn: boolean,
  autoBlocked: boolean,
): boolean {
  if (isOn) return humidity < t.idealMin;
  if (autoBlocked) return false;
  return humidity < t.humidityCritical;
}

export interface OpenCycle {
  source: 'AUTO' | 'MANUAL';
  startedAt: Date;
  plannedDurationMin: number | null;
}

/** Um ciclo aberto deve parar? O automático para no limite de tempo; o
 * manual para na duração pedida ou quando o solo passa da máxima. */
export function shouldStopCycle(cycle: OpenCycle, humidity: number | null, t: HumidityThresholds, now: Date): boolean {
  const elapsedMin = (now.getTime() - cycle.startedAt.getTime()) / 60_000;
  if (cycle.source === 'AUTO') return elapsedMin >= AUTO_MAX_MINUTES;
  if (cycle.plannedDurationMin !== null && elapsedMin >= cycle.plannedDurationMin) return true;
  return humidity !== null && humidity > t.humidityHigh;
}

/** Motivo registrado no ciclo, conforme a origem e a umidade na hora. */
export function irrigationReason(source: 'AUTO' | 'MANUAL', humidity: number | null, t: HumidityThresholds): string {
  if (source === 'AUTO' || (humidity !== null && humidity < t.humidityCritical)) {
    return 'Umidade abaixo do nível crítico.';
  }
  if (humidity !== null && humidity < t.humidityLow) return 'Umidade abaixo do ideal.';
  return 'Acionamento manual.';
}

export type Period = '6h' | '12h' | '24h' | '7d';
export const PERIODS: Period[] = ['6h', '12h', '24h', '7d'];

const HOUR = 60 * 60 * 1000;

/** Duração de cada período e tamanho do bucket do histórico (24 a 28 pontos
 * no gráfico). */
export const PERIOD_CONFIG: Record<Period, { durationMs: number; bucketMs: number }> = {
  '6h': { durationMs: 6 * HOUR, bucketMs: 15 * 60 * 1000 },
  '12h': { durationMs: 12 * HOUR, bucketMs: 30 * 60 * 1000 },
  '24h': { durationMs: 24 * HOUR, bucketMs: HOUR },
  '7d': { durationMs: 7 * 24 * HOUR, bucketMs: 6 * HOUR },
};

export interface TimedValue {
  humidity: number;
  createdAt: Date;
}

export interface HistoryBucket {
  start: Date;
  avg: number;
  min: number;
  max: number;
  count: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;
const mean = (list: number[]) => list.reduce((sum, v) => sum + v, 0) / list.length;

/** Agrupa leituras em buckets de tamanho fixo; buckets vazios são omitidos. */
export function bucketize(readings: TimedValue[], bucketMs: number): HistoryBucket[] {
  const buckets = new Map<number, number[]>();
  for (const reading of readings) {
    const key = Math.floor(reading.createdAt.getTime() / bucketMs) * bucketMs;
    const values = buckets.get(key) ?? [];
    values.push(reading.humidity);
    buckets.set(key, values);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([start, values]) => ({
      start: new Date(start),
      avg: round2(mean(values)),
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }));
}

export type Trend = 'UP' | 'DOWN' | 'STABLE';

export interface HumidityStats {
  count: number;
  current: number | null;
  avg: number | null;
  min: number | null;
  max: number | null;
  amplitude: number | null;
  trend: Trend | null;
}

/** Variação mínima (em pontos percentuais) entre as médias da primeira e da
 * segunda metade do período para considerar que a umidade subiu ou caiu. */
export const TREND_THRESHOLD = 1;

/** Estatísticas do período. `readings` deve vir em ordem cronológica. */
export function computeStats(readings: TimedValue[]): HumidityStats {
  if (readings.length === 0) {
    return { count: 0, current: null, avg: null, min: null, max: null, amplitude: null, trend: null };
  }
  const values = readings.map((r) => r.humidity);
  const min = Math.min(...values);
  const max = Math.max(...values);

  let trend: Trend = 'STABLE';
  if (values.length >= 2) {
    const half = Math.floor(values.length / 2);
    const delta = mean(values.slice(values.length - half)) - mean(values.slice(0, half));
    if (delta > TREND_THRESHOLD) trend = 'UP';
    else if (delta < -TREND_THRESHOLD) trend = 'DOWN';
  }

  return {
    count: values.length,
    current: values[values.length - 1],
    avg: round2(mean(values)),
    min,
    max,
    amplitude: round2(max - min),
    trend,
  };
}

/** Janela usada para estimar a taxa de secagem. */
export const DRYING_WINDOW_MS = 12 * HOUR;

/**
 * Queda média de umidade por hora sem irrigação nem chuva: soma só os
 * trechos em que a umidade caiu (as subidas são irrigação ou chuva) e divide
 * pelo tempo desses trechos. Null com menos de 30 minutos de quedas.
 * `readings` deve vir em ordem cronológica.
 */
export function dryingRatePerHour(readings: TimedValue[]): number | null {
  let drop = 0;
  let ms = 0;
  for (let i = 1; i < readings.length; i++) {
    const delta = readings[i].humidity - readings[i - 1].humidity;
    if (delta > 0) continue;
    drop -= delta;
    ms += readings[i].createdAt.getTime() - readings[i - 1].createdAt.getTime();
  }
  if (ms < 30 * 60 * 1000) return null;
  return round2(drop / (ms / HOUR));
}
