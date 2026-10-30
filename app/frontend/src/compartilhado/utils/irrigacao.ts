import type { Plant, Sensor, SessaoIrrigacao } from '../types';
import type { ComandoIrrigacaoRegistro } from '../context/PlantsContext';
import { LIMITE_RESERVATORIO_BAIXO } from './alertas';
import type { PlantaMonitorada } from './horta';

export interface Validacao {
  permitido: boolean;
  /** Motivo do bloqueio (só quando `permitido` é falso). */
  bloqueio?: string;
  /** Pontos de atenção que o usuário deve ver antes de confirmar. */
  avisos: string[];
}

/**
 * Valida o estado atual antes de iniciar uma irrigação manual.
 * Bloqueia: já em andamento, comando anterior ainda em envio, reservatório abaixo do mínimo.
 * Avisa (sem bloquear): reservatório sem leitura, solo acima do máximo, sem leitura confiável de umidade.
 * Permissão: o sistema ainda não tem perfis de usuário; a tela só é acessível a usuário autenticado (ProtectedRoute).
 */
export function validarInicioIrrigacao(planta: Plant, monitorada: PlantaMonitorada | undefined, sessao: SessaoIrrigacao, sensores: Sensor[], comando?: ComandoIrrigacaoRegistro): Validacao {
  const avisos: string[] = [];
  if (sessao.estado === 'ligada') return { permitido: false, bloqueio: 'Já há uma irrigação em andamento nesta planta.', avisos };
  if (comando?.situacao === 'enviando') return { permitido: false, bloqueio: 'O comando anterior ainda está sendo enviado. Aguarde alguns instantes.', avisos };

  const reservatorio = sensores.find((s) => s.tipo === 'nivel_agua');
  if (reservatorio) {
    if (reservatorio.status !== 'online') avisos.push('O nível do reservatório está indisponível (sensor sem comunicação): confirme no local que há água.');
    else if (reservatorio.valor < LIMITE_RESERVATORIO_BAIXO) {
      return { permitido: false, bloqueio: `O reservatório está com ${reservatorio.valor}% (mínimo ${LIMITE_RESERVATORIO_BAIXO}%). Reabasteça antes de irrigar.`, avisos };
    }
  }

  if (!monitorada || monitorada.estado === 'sem_dados') avisos.push('Não há leitura confiável de umidade: não é possível saber se a planta precisa de água.');
  else if (planta.umidadeAtual > planta.umidadeMaxima) avisos.push(`O solo já está com ${planta.umidadeAtual}%, acima do máximo (${planta.umidadeMaxima}%). Irrigar pode encharcar.`);

  return { permitido: true, avisos };
}

export const podePararIrrigacao = (sessao: SessaoIrrigacao) => sessao.estado === 'ligada';

export type SituacaoComando = 'nenhum' | 'enviando' | 'enviado' | 'falhou';

/** Texto para o usuário: o que o sistema sabe e o que ele NÃO sabe sobre o último comando. */
export function descreverComando(c: ComandoIrrigacaoRegistro | undefined, simulado: boolean): { situacao: SituacaoComando; texto: string } {
  if (!c) return { situacao: 'nenhum', texto: '' };
  const verbo = c.acao === 'iniciar' ? 'iniciar' : 'parar';
  if (c.situacao === 'enviando') return { situacao: 'enviando', texto: `Enviando comando para ${verbo} a irrigação…` };
  if (c.situacao === 'falhou') return { situacao: 'falhou', texto: `Falha: o comando para ${verbo} a irrigação não foi aceito. A irrigação pode não estar no estado exibido.` };
  return {
    situacao: 'enviado',
    texto: simulado
      ? `Comando para ${verbo} enviado em modo simulado: nenhum equipamento físico foi acionado.`
      : `Comando para ${verbo} enviado ao serviço. O dispositivo ainda não confirmou a execução.`,
  };
}

/**
 * Rótulo do estado da irrigação. "Em andamento" só aparece sem ressalvas quando não há dúvida; hoje o contrato com o backend
 * não devolve confirmação do equipamento, então fora da simulação o estado é "aguardando confirmação do dispositivo".
 */
export function rotuloEstadoIrrigacao(sessao: SessaoIrrigacao, comando: ComandoIrrigacaoRegistro | undefined, simulado: boolean): string {
  if (comando?.situacao === 'falhou') return 'Não confirmada (comando recusado)';
  if (sessao.estado !== 'ligada') return 'Desligada';
  if (simulado) return 'Em andamento (simulação)';
  return comando?.situacao === 'enviado' ? 'Comando enviado, aguardando confirmação do dispositivo' : 'Em andamento';
}
