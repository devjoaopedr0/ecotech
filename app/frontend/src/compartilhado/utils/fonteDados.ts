/**
 * Origem dos dados exibidos nas telas.
 * Hoje o PlantsContext lê tudo de utils/mockData.ts (a API só recebe comandos), então o rótulo é sempre "simulado".
 * Ao ligar o contexto à API real (ecotechApi.listarPlantas etc.), troque `tipo` para 'api' e o indicador do Header passa a refletir isso.
 */
export const FONTE_DADOS: { tipo: 'simulado' | 'api'; rotulo: string; descricao: string } = {
  tipo: 'simulado',
  rotulo: 'Dados simulados',
  descricao: 'Não há backend nem sensores físicos conectados: as leituras são exemplos gerados pelo sistema.',
};
