import type { Sensor } from '../../compartilhado/types';
import type { ComandoIrrigacaoRegistro } from '../../compartilhado/context/PlantsContext';
import { LIMITE_RESERVATORIO_BAIXO } from '../../compartilhado/utils/alertas';
import type { PlantaMonitorada } from '../../compartilhado/utils/horta';

/**
 * Regras da básica: traduzem o diagnóstico da planta (utils/horta.ts) para frases curtas, sem números técnicos
 * nem termos como "sensor travado" ou "limite crítico". Os critérios são os mesmos das outras dashboards.
 */

/* ------------------------------------------------------------------ estado de cada planta */

export type EstadoSimples = 'bem' | 'seca' | 'molhada' | 'sem_info';

export interface LeituraSimples {
  estado: EstadoSimples;
  rotulo: string;
  /** Uma frase dizendo o que está acontecendo e, quando houver, o que fazer. */
  frase: string;
  /** Pede ação agora (solo abaixo do limite crítico). */
  urgente: boolean;
}

export const ROTULO_SIMPLES: Record<EstadoSimples, string> = {
  bem: 'Está bem',
  seca: 'Precisa de água',
  molhada: 'Terra encharcada',
  sem_info: 'Sem informação',
};

export function estadoSimples(m: PlantaMonitorada): LeituraSimples {
  const p = m.planta;
  if (m.estado === 'sem_dados') {
    return {
      estado: 'sem_info',
      rotulo: ROTULO_SIMPLES.sem_info,
      frase: m.sensor ? 'Não estamos recebendo informações desta planta. Veja se o sensor está ligado.' : 'Esta planta ainda não tem sensor.',
      urgente: false,
    };
  }
  if (m.estado === 'critico') return { estado: 'seca', rotulo: ROTULO_SIMPLES.seca, frase: 'A terra está muito seca. Regue agora.', urgente: true };
  if (p.umidadeAtual < p.umidadeMinima) return { estado: 'seca', rotulo: ROTULO_SIMPLES.seca, frase: 'A terra está secando. Regue hoje.', urgente: false };
  if (p.umidadeAtual > p.umidadeMaxima) return { estado: 'molhada', rotulo: ROTULO_SIMPLES.molhada, frase: 'A terra já está muito molhada. Não regue por enquanto.', urgente: false };
  return { estado: 'bem', rotulo: ROTULO_SIMPLES.bem, frase: 'A terra está com a umidade certa.', urgente: false };
}

/* ------------------------------------------------------------------ o que fazer agora */

export interface Tarefa {
  id: string;
  texto: string;
  detalhe: string;
  urgente: boolean;
  plantaId?: string;
}

/**
 * Lista curta do que o usuário precisa fazer, urgentes primeiro. Planta que já está sendo regada não pede rega.
 * Planta "bem" não gera tarefa: a lista vazia significa que não há nada a fazer.
 */
export function tarefasDoDia(monitoradas: PlantaMonitorada[], sensores: Sensor[], regando: (plantaId: string) => boolean): Tarefa[] {
  const tarefas: Tarefa[] = [];

  const reservatorio = sensores.find((s) => s.tipo === 'nivel_agua');
  if (reservatorio && reservatorio.status !== 'online') {
    tarefas.push({ id: 'reservatorio', texto: 'Confira se o reservatório tem água', detalhe: 'O medidor do reservatório não está respondendo.', urgente: false });
  } else if (reservatorio && reservatorio.valor < LIMITE_RESERVATORIO_BAIXO) {
    tarefas.push({ id: 'reservatorio', texto: 'Encha o reservatório de água', detalhe: 'Ele está quase vazio. Sem água, não dá para regar.', urgente: true });
  }

  for (const m of monitoradas) {
    const { id, nome } = m.planta;
    const e = estadoSimples(m);
    if (e.estado === 'seca' && !regando(id)) tarefas.push({ id: `regar-${id}`, texto: `Regue ${nome} ${e.urgente ? 'agora' : 'hoje'}`, detalhe: e.frase, urgente: e.urgente, plantaId: id });
    if (e.estado === 'molhada') {
      // Terra encharcada com a água ainda ligada: o certo é parar a rega, não só "não regar".
      tarefas.push(
        regando(id)
          ? { id: `molhada-${id}`, texto: `Pare de regar ${nome}`, detalhe: 'A terra já está muito molhada e a água ainda está ligada.', urgente: true, plantaId: id }
          : { id: `molhada-${id}`, texto: `Não regue ${nome} por enquanto`, detalhe: 'A terra já está muito molhada.', urgente: false, plantaId: id },
      );
    }
    if (e.estado === 'sem_info') tarefas.push({ id: `sensor-${id}`, texto: m.sensor ? `Verifique o sensor de ${nome}` : `${nome} está sem sensor`, detalhe: e.frase, urgente: false, plantaId: id });
  }

  // sort é estável: dentro de cada grupo mantém a ordem de urgência das plantas.
  return tarefas.sort((a, b) => Number(b.urgente) - Number(a.urgente));
}

/* ------------------------------------------------------------------ resumo da horta */

export interface ResumoBasico {
  nivel: 'ok' | 'atencao' | 'critico';
  titulo: string;
  texto: string;
}

const coisas = (n: number) => (n === 1 ? '1 coisa' : `${n} coisas`);

export function resumoBasico(totalPlantas: number, tarefas: Tarefa[]): ResumoBasico {
  if (totalPlantas === 0) return { nivel: 'atencao', titulo: 'Nenhuma planta cadastrada', texto: 'Peça ajuda para cadastrar as plantas da sua horta.' };
  const urgentes = tarefas.filter((t) => t.urgente).length;
  if (urgentes > 0) return { nivel: 'critico', titulo: 'Sua horta precisa de você agora', texto: `${coisas(urgentes)} para fazer agora.` };
  if (tarefas.length > 0) return { nivel: 'atencao', titulo: 'Sua horta está quase toda bem', texto: `${coisas(tarefas.length)} para conferir.` };
  return { nivel: 'ok', titulo: 'Está tudo bem com sua horta', texto: 'Nada para fazer agora.' };
}

/* ------------------------------------------------------------------ retorno do botão de regar */

export type SituacaoRega = 'enviando' | 'regando' | 'falhou';

/**
 * Mensagem curta depois de apertar Regar/Parar. Segue a mesma honestidade da intermediária: fora da simulação,
 * "pedido enviado" não é "regando" enquanto o equipamento não confirmar.
 */
export function retornoDaRega(ligada: boolean, comando: ComandoIrrigacaoRegistro | undefined, simulado: boolean): { situacao: SituacaoRega; texto: string } | null {
  if (comando?.situacao === 'falhou') return { situacao: 'falhou', texto: 'Não deu certo. Tente de novo em alguns instantes.' };
  if (comando?.situacao === 'enviando') return { situacao: 'enviando', texto: 'Enviando o pedido…' };
  if (!ligada) return null;
  if (simulado) return { situacao: 'regando', texto: 'Regando (simulação: nenhum equipamento foi ligado).' };
  if (comando?.situacao === 'enviado') return { situacao: 'regando', texto: 'Pedido enviado. Esperando o equipamento confirmar.' };
  return { situacao: 'regando', texto: 'Regando…' };
}
