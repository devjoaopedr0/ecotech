/**
 * Regras de negócio da umidade do solo, sem dependência de framework ou
 * banco, para poderem ser testadas isoladamente.
 */

export type HumidityStatus = 'LOW' | 'ATTENTION' | 'IDEAL' | 'HIGH';

export interface HumidityRange {
  humidityMin: number;
  humidityMax: number;
}

/** Fração inferior da faixa ideal tratada como "Atenção". */
export const ATTENTION_FRACTION = 0.15;

/** Limite abaixo do qual uma leitura dentro da faixa vira "Atenção". */
export function attentionThreshold({ humidityMin, humidityMax }: HumidityRange): number {
  return humidityMin + (humidityMax - humidityMin) * ATTENTION_FRACTION;
}

/** Abaixo do mínimo é LOW, acima do máximo é HIGH, nos 15% inferiores da
 * faixa é ATTENTION e no resto da faixa é IDEAL. */
export function humidityStatus(humidity: number, range: HumidityRange): HumidityStatus {
  if (humidity < range.humidityMin) return 'LOW';
  if (humidity > range.humidityMax) return 'HIGH';
  if (humidity < attentionThreshold(range)) return 'ATTENTION';
  return 'IDEAL';
}

/**
 * Modo automático: liga abaixo do mínimo e desliga quando a umidade sai da
 * zona de atenção (volta ao "Ideal") ou passa do máximo. Entre o mínimo e o
 * limite de atenção o estado atual é mantido, o que evita liga-desliga a
 * cada leitura perto do mínimo.
 */
export function autoIrrigationDecision(humidity: number, range: HumidityRange, isOn: boolean): boolean {
  if (humidity < range.humidityMin) return true;
  if (humidity >= attentionThreshold(range)) return false;
  return isOn;
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
