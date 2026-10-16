import type { EcotechApi } from './types';
import { climaInicial, consumoInicial, culturasIniciais, historicoIrrigacaoInicial, plantasIniciais, sensoresIniciais } from '../utils/mockData';

/** Implementação SIMULADA: não usa rede e não envia nada a nenhum equipamento. */
export const mockEcotechApi: EcotechApi = {
  listarPlantas: async () => plantasIniciais,
  listarSensores: async () => sensoresIniciais,
  listarHistoricoIrrigacao: async () => historicoIrrigacaoInicial,
  listarConsumoAgua: async () => consumoInicial,
  obterPrevisaoTempo: async () => climaInicial,
  listarCulturas: async () => Object.values(culturasIniciais),
  salvarCalibracao: async () => undefined,
  enviarComandoIrrigacao: async () => undefined,
};
