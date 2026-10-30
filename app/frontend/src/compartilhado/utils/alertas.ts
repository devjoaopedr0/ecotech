import type { Alerta, LeituraColetada, Plant, PlantStatus, Sensor, SessaoIrrigacao } from '../types';
import { avaliarSensor, avaliarLeituraDaPlanta } from './sensores';
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
  sessoes: Record<string, SessaoIrrigacao | undefined>,
  leituras: LeituraColetada[],
  agora: number
): Alerta[] {
  const out: Alerta[] = [];

  for (const p of plantas) {
    // Sem leitura confiável (offline, travada, inválida ou desatualizada) não há alerta de umidade: o problema é o sensor,
    // e ele tem alerta próprio. Alertar umidade com um número duvidoso seria apresentar suposição como fato.
    if (!avaliarLeituraDaPlanta(p, sensores, leituras, agora).confiavel) continue;
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
        indicador: 'Umidade do solo',
        valorAtual: `${p.umidadeAtual}%`,
        limite: `crítica ${p.umidadeCritica}%`,
        acao: irrigando ? 'Irrigação em andamento: acompanhe a recuperação da umidade.' : 'Verifique o canteiro e inicie a irrigação.',
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
        indicador: 'Umidade do solo',
        valorAtual: `${p.umidadeAtual}%`,
        limite: `mínimo ${p.umidadeMinima}%`,
        acao: 'O solo está secando: acompanhe e planeje a irrigação.',
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
        indicador: 'Umidade do solo',
        valorAtual: `${p.umidadeAtual}%`,
        limite: `máximo ${p.umidadeMaxima}%`,
        acao: 'Evite irrigar e verifique a drenagem do canteiro.',
      });
    }
  }

  for (const s of sensores) {
    const leitura = avaliarSensor(s, leituras, agora);
    if (s.status === 'online' && (leitura.situacao === 'invalida' || leitura.situacao === 'desatualizada')) {
      out.push({
        id: `leitura-${s.id}`,
        tipo: leitura.situacao === 'invalida' ? 'leitura_invalida' : 'leitura_desatualizada',
        severidade: 'atencao',
        titulo: leitura.situacao === 'invalida' ? 'Leitura inválida' : 'Leitura desatualizada',
        mensagem: `${s.nome} (${s.localizacao}): ${leitura.detalhe}`,
        plantaId: s.plantaId,
        criadoEm: 0,
        indicador: 'Qualidade da leitura',
        valorAtual: leitura.situacao === 'invalida' ? 'Inválida' : 'Desatualizada',
        acao: 'Confira o sensor e a conexão; a leitura não é usada para classificar a planta enquanto isso.',
      });
    }
    if (s.status === 'offline') {
      out.push({
        id: `off-${s.id}`,
        tipo: 'sensor_offline',
        severidade: 'atencao',
        titulo: 'Sensor offline',
        mensagem: `${s.nome} (${s.localizacao}) não está enviando leituras.`,
        plantaId: s.plantaId,
        criadoEm: 0, // alertas de estado não têm instante próprio; eventos (com horário) aparecem antes dentro da mesma gravidade
        indicador: 'Comunicação do sensor',
        valorAtual: 'Offline',
        acao: 'Verifique alimentação, sinal e conexão do sensor.',
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
        indicador: 'Nível do reservatório',
        valorAtual: `${s.valor}%`,
        limite: `mínimo ${LIMITE_RESERVATORIO_BAIXO}%`,
        acao: 'Reabasteça o reservatório.',
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
        indicador: 'Temperatura do ar',
        valorAtual: `${s.valor.toFixed(1)} °C`,
        limite: `máximo ${LIMITE_TEMPERATURA_ELEVADA} °C`,
        acao: 'Verifique ventilação e sombreamento da área.',
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
      indicador: 'Temperatura foliar − temperatura do ar',
      valorAtual: `+${(folha.valor - ar.valor).toFixed(1)} °C`,
      limite: `a partir de +${LIMITE_FOLHA_MAIS_QUENTE} °C`,
      acao: 'Confira a umidade do solo antes de decidir irrigar (é um indício, não um diagnóstico).',
    });
  }

  return out;
}

/** Mais graves primeiro; dentro da mesma gravidade, os mais recentes. */
export function ordenarAlertas(alertas: Alerta[]): Alerta[] {
  return [...alertas].sort((a, b) => ORDEM[a.severidade] - ORDEM[b.severidade] || b.criadoEm - a.criadoEm);
}
