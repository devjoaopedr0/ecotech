import type { PlantaMonitorada } from '../../compartilhado/utils/horta';

/**
 * Semáforo ambiental da intermediária. Deriva do diagnóstico da planta (utils/horta.ts), que já usa os limites
 * de CADA planta (críticos, mínimos e máximos cadastrados) e só considera leituras confiáveis.
 *  - Adequado: umidade dentro dos limites da planta e temperatura dentro da faixa da cultura.
 *  - Atenção:  umidade fora do mínimo/máximo, ou temperatura fora da faixa da cultura.
 *  - Crítico:  umidade abaixo do limite crítico da planta.
 *  - Sem dados: sem sensor, sensor sem comunicação, leitura inválida, travada ou desatualizada. Nunca vira "Adequado".
 */
export type NivelSemaforo = 'adequado' | 'atencao' | 'critico' | 'sem_dados';

export interface Semaforo {
  nivel: NivelSemaforo;
  /** Texto exibido junto da cor (a cor nunca comunica sozinha). */
  rotulo: string;
  /** Motivos que sustentam o nível, com os números usados. */
  motivos: string[];
}

export const ROTULO_SEMAFORO: Record<NivelSemaforo, string> = {
  adequado: 'Adequado',
  atencao: 'Atenção',
  critico: 'Crítico',
  sem_dados: 'Sem dados recentes',
};

export function semaforoDaPlanta(m: PlantaMonitorada): Semaforo {
  if (m.estado === 'sem_dados') {
    return { nivel: 'sem_dados', rotulo: m.sensor ? ROTULO_SEMAFORO.sem_dados : 'Sem sensor', motivos: [m.motivo] };
  }
  const motivos = [m.motivo, ...(m.avisoTemperatura ? [m.avisoTemperatura] : [])];
  if (m.estado === 'critico') return { nivel: 'critico', rotulo: ROTULO_SEMAFORO.critico, motivos };
  if (m.estado === 'atencao' || m.avisoTemperatura) return { nivel: 'atencao', rotulo: ROTULO_SEMAFORO.atencao, motivos };
  return { nivel: 'adequado', rotulo: ROTULO_SEMAFORO.adequado, motivos };
}

export function contarSemaforo(lista: PlantaMonitorada[]): Record<NivelSemaforo, number> {
  const out: Record<NivelSemaforo, number> = { adequado: 0, atencao: 0, critico: 0, sem_dados: 0 };
  for (const m of lista) out[semaforoDaPlanta(m).nivel]++;
  return out;
}

/** Planta que exige ação do usuário (exclui "sem dados", que é problema de leitura, não da planta). */
export const precisaAtencao = (m: PlantaMonitorada) => {
  const n = semaforoDaPlanta(m).nivel;
  return n === 'atencao' || n === 'critico';
};
