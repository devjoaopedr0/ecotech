import type { LeituraColetada, Plant } from '../../compartilhado/types';
import { formatarRelativo } from '../../compartilhado/utils/format';
import { FATOR_DESATUALIZADO, intervaloEsperadoMs } from '../../compartilhado/utils/sensores';

export interface StatusDados {
  /** Leitura mais recente registrada (ms); null quando não há nenhuma. */
  ultimaMs: number | null;
  desatualizado: boolean;
  /** Texto para o usuário quando `desatualizado`. */
  aviso: string | null;
  /** Tolerância usada (ms): FATOR_DESATUALIZADO × intervalo esperado; null quando não há leituras para estimar a frequência. */
  limiteMs: number | null;
}

const mediana = (v: number[]) => {
  const o = [...v].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
};

/**
 * Os dados estão desatualizados quando a leitura mais recente passa de 3× o intervalo esperado entre leituras
 * (a mesma tolerância que a avaliação de cada sensor usa em utils/sensores.ts). Sem leituras suficientes para
 * estimar o intervalo, não afirma nada: apenas informa o horário da última leitura.
 */
export function avaliarAtualizacao(plantas: Plant[], leituras: LeituraColetada[], agora: number): StatusDados {
  const ultimaMs = leituras.reduce<number | null>((u, l) => (u === null || l.ts > u ? l.ts : u), null);
  const intervalos = plantas.map((p) => intervaloEsperadoMs(p.id, leituras)).filter((v): v is number => v !== null);
  const limiteMs = intervalos.length ? FATOR_DESATUALIZADO * mediana(intervalos) : null;

  if (ultimaMs === null) {
    return { ultimaMs, desatualizado: true, limiteMs, aviso: 'O sistema não tem nenhuma leitura registrada. Os valores exibidos não são medições atuais.' };
  }
  if (limiteMs !== null && agora - ultimaMs > limiteMs) {
    return {
      ultimaMs,
      desatualizado: true,
      limiteMs,
      aviso: `A última leitura foi registrada ${formatarRelativo(ultimaMs, agora)}, acima da tolerância de ${Math.round(limiteMs / 3_600_000)} h. Os valores exibidos podem não refletir a situação atual.`,
    };
  }
  return { ultimaMs, desatualizado: false, limiteMs, aviso: null };
}
