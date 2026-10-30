import type { LeituraColetada, Plant, Sensor } from '../types';
import { LIMITE_SENSOR_TRAVADO_H } from './analise';
import { RESOLUCAO } from './calibracao';
import { formatarRelativo } from './format';

/**
 * Confiabilidade das leituras e diagnóstico de sensores.
 * É a fonte única das duas dashboards: o estado da planta, os alertas de umidade e o diagnóstico da avançada usam estas regras.
 *
 * Princípio: só se afirma um problema quando há evidência nos dados. Falta de dado vira "sem dados suficientes", nunca "defeito".
 */

/** Número mínimo de leituras de rotina para estimar a frequência esperada de um sensor. */
export const MIN_LEITURAS_FREQUENCIA = 3;
/** Uma leitura é considerada desatualizada quando passa deste múltiplo do intervalo esperado. */
export const FATOR_DESATUALIZADO = 3;

export type SituacaoLeitura = 'ok' | 'ausente' | 'offline' | 'travada' | 'invalida' | 'desatualizada';

export interface AvaliacaoLeitura {
  situacao: SituacaoLeitura;
  /** Só leituras 'ok' devem alimentar estado, média, alertas e automação. */
  confiavel: boolean;
  /** Texto para o usuário, com os números que sustentam a conclusão. */
  detalhe: string;
  /** Último instante conhecido de leitura (ms); null sem registro. */
  ultimaMs: number | null;
  /** Intervalo esperado entre leituras (ms), estimado das leituras de rotina; null se não há dados para estimar. */
  intervaloEsperadoMs: number | null;
}

const mediana = (v: number[]) => {
  const o = [...v].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
};

/** Frequência esperada = mediana do intervalo entre leituras de rotina da planta. Null com poucas leituras. */
export function intervaloEsperadoMs(plantaId: string, leituras: LeituraColetada[]): number | null {
  const ts = leituras
    .filter((l) => l.plantaId === plantaId && l.fase === 'rotina')
    .map((l) => l.ts)
    .sort((a, b) => a - b);
  if (ts.length < MIN_LEITURAS_FREQUENCIA) return null;
  const difs = ts.slice(1).map((t, i) => t - ts[i]).filter((d) => d > 0);
  return difs.length >= MIN_LEITURAS_FREQUENCIA - 1 ? mediana(difs) : null;
}

const ultimaDaPlanta = (plantaId: string, leituras: LeituraColetada[]): number | null =>
  leituras.reduce<number | null>((u, l) => (l.plantaId === plantaId && (u === null || l.ts > u) ? l.ts : u), null);

const valorInvalido = (s: Sensor): string | null => {
  if (!Number.isFinite(s.valor)) return 'valor não numérico';
  const percentual = s.tipo === 'umidade' || s.tipo === 'nivel_agua' || s.tipo === 'umidade_ar';
  if (percentual && (s.valor < 0 || s.valor > 100)) return `valor de ${s.valor}% fora de 0–100%`;
  if (s.tipo === 'luminosidade' && s.valor < 0) return 'luminosidade negativa';
  if (s.bruto !== undefined && s.calibracao && (s.bruto < 0 || s.bruto > RESOLUCAO[s.calibracao.placa])) {
    return `leitura bruta ${s.bruto} fora da escala 0–${RESOLUCAO[s.calibracao.placa]} da placa`;
  }
  return null;
};

/** Avalia a leitura atual de um sensor (qualquer tipo). `plantaId` é usado para localizar as leituras registradas de umidade. */
export function avaliarSensor(sensor: Sensor | undefined, leituras: LeituraColetada[], agora: number): AvaliacaoLeitura {
  const plantaId = sensor?.tipo === 'umidade' ? sensor.plantaId : undefined;
  const registrada = plantaId ? ultimaDaPlanta(plantaId, leituras) : null;
  const intervalo = plantaId ? intervaloEsperadoMs(plantaId, leituras) : null;
  const base = { intervaloEsperadoMs: intervalo };

  if (!sensor) return { ...base, situacao: 'ausente', confiavel: false, detalhe: 'Nenhum sensor associado.', ultimaMs: registrada };

  if (sensor.status !== 'online') {
    const ultima = sensor.ultimaLeituraMs ?? registrada;
    return {
      ...base,
      situacao: 'offline',
      confiavel: false,
      detalhe: ultima ? `Sem comunicação. Última leitura ${formatarRelativo(ultima, agora)}.` : 'Sem comunicação e sem leituras registradas.',
      ultimaMs: ultima,
    };
  }

  const invalido = valorInvalido(sensor);
  if (invalido) return { ...base, situacao: 'invalida', confiavel: false, detalhe: `Leitura inválida: ${invalido}.`, ultimaMs: registrada };

  if ((sensor.estavelHoras ?? 0) >= LIMITE_SENSOR_TRAVADO_H) {
    return {
      ...base,
      situacao: 'travada',
      confiavel: false,
      detalhe: `Leitura sem variação há ${sensor.estavelHoras} h; o sensor pode estar travado (não confirmado).`,
      ultimaMs: registrada,
    };
  }

  if (registrada !== null && intervalo !== null && agora - registrada > FATOR_DESATUALIZADO * intervalo) {
    const limiteH = Math.round((FATOR_DESATUALIZADO * intervalo) / 3_600_000);
    return {
      ...base,
      situacao: 'desatualizada',
      confiavel: false,
      detalhe: `Última leitura registrada ${formatarRelativo(registrada, agora)}; o esperado é uma leitura a cada ~${Math.max(1, Math.round(intervalo / 60_000))} min (limite de tolerância ≈ ${limiteH} h).`,
      ultimaMs: registrada,
    };
  }

  return { ...base, situacao: 'ok', confiavel: true, detalhe: 'Leitura recente e dentro do esperado.', ultimaMs: registrada };
}

/** Atalho: avalia o sensor de umidade associado a uma planta. */
export function avaliarLeituraDaPlanta(planta: Plant, sensores: Sensor[], leituras: LeituraColetada[], agora: number): AvaliacaoLeitura {
  return avaliarSensor(sensores.find((s) => s.tipo === 'umidade' && s.plantaId === planta.id), leituras, agora);
}

export const ROTULO_SITUACAO_LEITURA: Record<SituacaoLeitura, string> = {
  ok: 'Leitura confiável',
  ausente: 'Sem sensor',
  offline: 'Sem comunicação',
  travada: 'Possível travamento',
  invalida: 'Leitura inválida',
  desatualizada: 'Leitura desatualizada',
};

/**
 * Última comunicação conhecida. Só existe horário para sensores offline e para os de umidade (leituras registradas);
 * para os demais o sistema não guarda timestamp, então devolve null em vez de afirmar "agora".
 */
export function ultimaComunicacaoMs(sensor: Sensor, leituras: LeituraColetada[]): number | null {
  if (sensor.status !== 'online') return sensor.ultimaLeituraMs ?? (sensor.plantaId ? ultimaDaPlanta(sensor.plantaId, leituras) : null);
  return sensor.tipo === 'umidade' && sensor.plantaId ? ultimaDaPlanta(sensor.plantaId, leituras) : null;
}
