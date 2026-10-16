import type { Calibracao, Clima, ConsumoDia, Cultura, Plant, RegistroIrrigacao, Sensor } from '../types';

export interface ComandoIrrigacao {
  plantaId: string;
  acao: 'iniciar' | 'parar';
  origem: 'automatica' | 'manual';
  /** Minutos; null = até receber o comando "parar". */
  duracaoMin: number | null;
}

/**
 * Contrato entre o front-end e o backend. As telas só conhecem esta interface:
 * trocar mock por HTTP (ou por outro transporte) não exige mudar nenhuma tela.
 */
export interface EcotechApi {
  listarPlantas(): Promise<Plant[]>;
  listarSensores(): Promise<Sensor[]>;
  listarHistoricoIrrigacao(): Promise<RegistroIrrigacao[]>;
  listarConsumoAgua(): Promise<ConsumoDia[]>;
  obterPrevisaoTempo(): Promise<Clima>;
  listarCulturas(): Promise<Cultura[]>;
  /** O dispositivo envia só o valor bruto (ADC); a calibração seco/molhado fica no sistema. */
  salvarCalibracao(sensorId: string, calibracao: Calibracao): Promise<void>;
  /** O backend repassa o comando ao controlador (ESP32/Arduino). */
  enviarComandoIrrigacao(comando: ComandoIrrigacao): Promise<void>;
}
