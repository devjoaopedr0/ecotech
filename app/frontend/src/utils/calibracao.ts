import type { Calibracao, Plant, PlacaSensor } from '../types';

export const RESOLUCAO: Record<PlacaSensor, number> = { arduino: 1023, esp32: 4095 };
export const ROTULO_PLACA: Record<PlacaSensor, string> = { arduino: 'Arduino (0–1023)', esp32: 'ESP32 (0–4095)' };

/** Valores de partida típicos de um sensor capacitivo; devem ser medidos em cada sensor. */
export const CALIBRACAO_PADRAO: Record<PlacaSensor, Calibracao> = {
  esp32: { placa: 'esp32', brutoSeco: 3200, brutoMolhado: 1300 },
  arduino: { placa: 'arduino', brutoSeco: 800, brutoMolhado: 330 },
};

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Converte a leitura bruta em % (interpolação linear; sensores capacitivos leem mais alto quando mais seco). */
export function brutoParaPercentual(bruto: number, c: Calibracao): number {
  const faixa = c.brutoSeco - c.brutoMolhado;
  if (faixa === 0) return 0;
  return Math.round(limitar(((c.brutoSeco - bruto) / faixa) * 100, 0, 100));
}

export function percentualParaBruto(pct: number, c: Calibracao): number {
  return Math.round(c.brutoSeco - (limitar(pct, 0, 100) / 100) * (c.brutoSeco - c.brutoMolhado));
}

export function validarCalibracao(c: Calibracao, profundidadeCm?: number): string | null {
  const max = RESOLUCAO[c.placa];
  if (![c.brutoSeco, c.brutoMolhado].every((v) => Number.isFinite(v) && v >= 0 && v <= max)) {
    return `Os valores brutos devem estar entre 0 e ${max} para ${c.placa === 'esp32' ? 'ESP32' : 'Arduino'}.`;
  }
  if (c.brutoSeco === c.brutoMolhado) return 'Os valores seco e molhado devem ser diferentes.';
  if (profundidadeCm !== undefined && (!Number.isFinite(profundidadeCm) || profundidadeCm <= 0)) return 'Informe uma profundidade maior que zero.';
  return null;
}

export type CondicaoSolo = 'seco' | 'adequado' | 'excesso';
export const ROTULO_CONDICAO: Record<CondicaoSolo, string> = { seco: 'Seco', adequado: 'Adequado', excesso: 'Excesso de água' };

/** Faixas de manejo: seco abaixo da mínima, excesso acima da máxima. */
export function condicaoSolo(p: Pick<Plant, 'umidadeAtual' | 'umidadeMinima' | 'umidadeMaxima'>): CondicaoSolo {
  if (p.umidadeAtual < p.umidadeMinima) return 'seco';
  if (p.umidadeAtual > p.umidadeMaxima) return 'excesso';
  return 'adequado';
}

/** Convenção atual: cada planta tem um sensor de umidade com id "umi-<plantaId>". */
export const idSensorUmidade = (plantaId: string) => `umi-${plantaId}`;
