import { apiBaseUrl } from '../api/client';

/**
 * Origem dos dados exibidos nas telas. Com VITE_API_URL definido o PlantsContext carrega tudo do backend
 * (ver api/index.ts); sem ele, as telas mostram a simulação de utils/mockData.ts.
 */
export const FONTE_DADOS: { tipo: 'simulado' | 'api'; rotulo: string; descricao: string } = apiBaseUrl()
  ? {
      tipo: 'api',
      rotulo: 'Conectado à API',
      descricao: 'Os dados vêm do backend do sistema, atualizados a cada 15 segundos.',
    }
  : {
      tipo: 'simulado',
      rotulo: 'Dados simulados',
      descricao: 'Não há backend nem sensores físicos conectados: as leituras são exemplos gerados pelo sistema.',
    };
