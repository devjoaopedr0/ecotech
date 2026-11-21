import type { Calibracao, Clima, ConsumoDia, Cultura, NovoUsuario, Plant, RegistroIrrigacao, Sensor, UsuarioCadastrado } from '../types';

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
  /**
   * Cria a conta com o nível de visualização escolhido. Usuário ou e-mail já em uso: ApiError 409
   * com `detalhe.campo` = 'usuario' | 'email' (o corpo de erro do backend é repassado em `detalhe`).
   */
  cadastrarUsuario(dados: NovoUsuario): Promise<UsuarioCadastrado>;
}
