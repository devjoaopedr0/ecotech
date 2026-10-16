import type { EcotechApi } from './types';
import { ENDPOINTS } from './endpoints';
import { requisitar } from './client';

/** Implementação real (REST). Só é usada quando VITE_API_URL está definido. */
export const httpEcotechApi: EcotechApi = {
  listarPlantas: () => requisitar(ENDPOINTS.plantas),
  listarSensores: () => requisitar(ENDPOINTS.sensores),
  listarHistoricoIrrigacao: () => requisitar(ENDPOINTS.irrigacoes),
  listarConsumoAgua: () => requisitar(ENDPOINTS.consumoAgua),
  obterPrevisaoTempo: () => requisitar(ENDPOINTS.clima),
  listarCulturas: () => requisitar(ENDPOINTS.culturas),
  salvarCalibracao: (sensorId, calibracao) => requisitar(ENDPOINTS.calibracaoSensor(sensorId), { metodo: 'PUT', corpo: calibracao }),
  enviarComandoIrrigacao: (comando) => requisitar(ENDPOINTS.comandoIrrigacao, { metodo: 'POST', corpo: comando }),
};
