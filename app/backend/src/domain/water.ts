/**
 * Consumo e economia de água. A economia é medida contra uma irrigação
 * convencional de horário fixo: cada planta regada `irrigationsPerDay` vezes
 * por dia (da cultura, ou 1), por CONVENTIONAL_MINUTES minutos, na vazão do
 * seu ponto de irrigação.
 */

export const CONVENTIONAL_MINUTES = 4;
export const DEFAULT_IRRIGATIONS_PER_DAY = 1;

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Litros de um ciclo de irrigação. */
export function cycleLiters(startedAt: Date, endedAt: Date, flowRateLpm: number): number {
  const minutes = Math.max(0, endedAt.getTime() - startedAt.getTime()) / 60_000;
  return round2(minutes * flowRateLpm);
}

/** Litros que um timer gastaria por dia com essa planta. */
export function conventionalDailyLiters(irrigationsPerDay: number | null, flowRateLpm: number): number {
  return round2((irrigationsPerDay ?? DEFAULT_IRRIGATIONS_PER_DAY) * CONVENTIONAL_MINUTES * flowRateLpm);
}

export interface WaterSummary {
  usedLiters: number;
  conventionalLiters: number;
  savedLiters: number;
  savingPercent: number;
  cost: number;
  savedCost: number;
}

/** Totais do período. A tarifa é em R$ por m³. */
export function summarizeWater(usedLiters: number, conventionalLiters: number, tariffPerM3: number): WaterSummary {
  const saved = Math.max(0, conventionalLiters - usedLiters);
  return {
    usedLiters: round2(usedLiters),
    conventionalLiters: round2(conventionalLiters),
    savedLiters: round2(saved),
    savingPercent: conventionalLiters > 0 ? Math.round((saved / conventionalLiters) * 100) : 0,
    cost: round2((usedLiters / 1000) * tariffPerM3),
    savedCost: round2((saved / 1000) * tariffPerM3),
  };
}

/** Data local (AAAA-MM-DD) de um instante no fuso informado. */
export function localDate(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone });
    return true;
  } catch {
    return false;
  }
}
