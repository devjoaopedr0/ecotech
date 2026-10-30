import type { Plant, PlantStatus } from '../types';

type LimitesPlanta = Pick<Plant, 'umidadeAtual' | 'umidadeCritica' | 'umidadeMinima' | 'umidadeMaxima'>;

/**
 * Regras de status:
 *  - Crítico:  umidade abaixo da umidade crítica
 *  - Atenção:  abaixo da umidade mínima ou acima da máxima
 *  - Normal:   demais casos (internamente 'ideal')
 */
export function statusDaPlanta(p: LimitesPlanta): PlantStatus {
  if (p.umidadeAtual < p.umidadeCritica) return 'critico';
  if (p.umidadeAtual < p.umidadeMinima || p.umidadeAtual > p.umidadeMaxima) return 'atencao';
  return 'ideal';
}

export interface LimitesEditaveis {
  umidadeCritica: number;
  umidadeMinima: number;
  faixaMin: number;
  faixaMax: number;
  umidadeMaxima: number;
}

/** Retorna a mensagem de erro, ou null se os limites forem coerentes. */
export function validarLimites(l: LimitesEditaveis): string | null {
  const valores = [l.umidadeCritica, l.umidadeMinima, l.faixaMin, l.faixaMax, l.umidadeMaxima];
  if (valores.some((v) => !Number.isFinite(v) || v < 0 || v > 100)) {
    return 'Os limites de umidade devem estar entre 0% e 100%.';
  }
  if (l.umidadeCritica >= l.umidadeMinima) return 'A umidade crítica deve ser menor que a umidade mínima.';
  if (l.umidadeMinima > l.faixaMin) return 'A umidade mínima não pode ser maior que o início da faixa ideal.';
  if (l.faixaMin >= l.faixaMax) return 'A faixa mínima deve ser menor que a faixa máxima.';
  if (l.faixaMax > l.umidadeMaxima) return 'A umidade máxima não pode ser menor que o fim da faixa ideal.';
  return null;
}
