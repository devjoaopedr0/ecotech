import type { Alerta, Plant, PlantStatus, Sensor, SessaoIrrigacao } from '../types';
import { statusDaPlanta } from './umidade';

export const LIMITE_RESERVATORIO_BAIXO = 20; // %
export const LIMITE_TEMPERATURA_ELEVADA = 32; // °C
export const LIMITE_FOLHA_MAIS_QUENTE = 3; // °C acima do ar

const ORDEM: Record<PlantStatus, number> = { critico: 0, abaixo: 1, atencao: 2, ideal: 3 };

const rotuloLocal = (p: Plant) => `${p.canteiro} (${p.nome})`;

/**
 * Alertas "de estado": derivados dos dados atuais, somem sozinhos quando o problema é resolvido.
 * (Alertas de evento, como irrigação iniciada/concluída, ficam registrados no contexto.)
 */
export function gerarAlertasDeEstado(
  plantas: Plant[],
  sensores: Sensor[],
  sessoes: Record<string, SessaoIrrigacao | undefined>
): Alerta[] {
  const out: Alerta[] = [];

  for (const p of plantas) {
    const status = statusDaPlanta(p);
    const sessao = sessoes[p.id];
    const irrigando = sessao?.estado === 'ligada';

    if (status === 'critico') {
      out.push({
        id: `crit-${p.id}`,
        tipo: 'umidade_critica',
        severidade: 'critico',
        titulo: 'Umidade crítica',
        mensagem: `O solo do ${rotuloLocal(p)} está com ${p.umidadeAtual}% de umidade. Limite crítico: ${p.umidadeCritica}%.${
          irrigando ? '' : ' Recomenda-se iniciar a irrigação.'
        }`,
        plantaId: p.id,
        criadoEm: 0, // alertas de estado não têm instante próprio; eventos (com horário) aparecem antes dentro da mesma gravidade
      });
    } else if (p.umidadeAtual < p.umidadeMinima) {
      out.push({
        id: `baixa-${p.id}`,
        tipo: 'umidade_baixa',
        severidade: 'atencao',
        titulo: 'Umidade baixa',
        mensagem: `${p.nome} está com ${p.umidadeAtual}% de umidade (mínimo ${p.umidadeMinima}%).`,
        plantaId: p.id,
        criadoEm: 0, // alertas de estado não têm instante próprio; eventos (com horário) aparecem antes dentro da mesma gravidade
      });
    } else if (p.umidadeAtual > p.umidadeMaxima) {
      out.push({
        id: `alta-${p.id}`,
        tipo: 'umidade_alta',
        severidade: 'atencao',
        titulo: 'Umidade alta',
        mensagem: `${p.nome} está com ${p.umidadeAtual}% de umidade (máximo ${p.umidadeMaxima}%).`,
        plantaId: p.id,
        criadoEm: 0, // alertas de estado não têm instante próprio; eventos (com horário) aparecem antes dentro da mesma gravidade
      });
    }
  }

  for (const s of sensores) {
    if (s.status === 'offline') {
      out.push({
        id: `off-${s.id}`,
        tipo: 'sensor_offline',
        severidade: 'atencao',
        titulo: 'Sensor offline',
        mensagem: `${s.nome} (${s.localizacao}) não está enviando leituras.`,
        plantaId: s.plantaId,
        criadoEm: 0, // alertas de estado não têm instante próprio; eventos (com horário) aparecem antes dentro da mesma gravidade
      });
      continue;
    }
    if (s.tipo === 'nivel_agua' && s.valor < LIMITE_RESERVATORIO_BAIXO) {
      out.push({
        id: `res-${s.id}`,
        tipo: 'reservatorio_baixo',
        severidade: 'critico',
        titulo: 'Reservatório baixo',
        mensagem: `${s.localizacao} está com ${s.valor}% de água. Reabasteça para manter a irrigação.`,
        criadoEm: 0, // alertas de estado não têm instante próprio; eventos (com horário) aparecem antes dentro da mesma gravidade
      });
    }
    if (s.tipo === 'temperatura' && s.valor > LIMITE_TEMPERATURA_ELEVADA) {
      out.push({
        id: `temp-${s.id}`,
        tipo: 'temperatura_elevada',
        severidade: 'atencao',
        titulo: 'Temperatura elevada',
        mensagem: `${s.localizacao} está com ${s.valor.toFixed(1)}°C (limite ${LIMITE_TEMPERATURA_ELEVADA}°C).`,
        criadoEm: 0, // alertas de estado não têm instante próprio; eventos (com horário) aparecem antes dentro da mesma gravidade
      });
    }
  }

  // Planta mais quente que o ar sugere fechamento dos estômatos (possível estresse hídrico).
  const folha = sensores.find((x) => x.tipo === 'temperatura_folha' && x.status === 'online');
  const ar = sensores.find((x) => x.tipo === 'temperatura' && x.status === 'online');
  if (folha && ar && folha.valor - ar.valor >= LIMITE_FOLHA_MAIS_QUENTE) {
    out.push({
      id: `estresse-${folha.id}`,
      tipo: 'estresse_hidrico',
      severidade: 'atencao',
      titulo: 'Possível estresse hídrico',
      mensagem: `A temperatura foliar (${folha.valor.toFixed(1)}°C) está ${(folha.valor - ar.valor).toFixed(1)}°C acima da do ar. Verifique a umidade do solo.`,
      criadoEm: 0,
    });
  }

  return out;
}

/** Mais graves primeiro; dentro da mesma gravidade, os mais recentes. */
export function ordenarAlertas(alertas: Alerta[]): Alerta[] {
  return [...alertas].sort((a, b) => ORDEM[a.severidade] - ORDEM[b.severidade] || b.criadoEm - a.criadoEm);
}
