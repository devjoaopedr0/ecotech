// 'abaixo' é mantido por compatibilidade com o modelo anterior (3 estados novos: ideal=Normal, atencao, critico).
export type PlantStatus = 'ideal' | 'atencao' | 'abaixo' | 'critico';

export interface Plant {
  id: string;
  nome: string;
  tipo: string;
  emoji: string;
  umidadeAtual: number;
  /** Faixa ideal de umidade (início). */
  faixaMin: number;
  /** Faixa ideal de umidade (fim). */
  faixaMax: number;
  /** Abaixo deste valor a planta entra em "Atenção". */
  umidadeMinima: number;
  /** Acima deste valor a planta entra em "Atenção" (solo encharcado). */
  umidadeMaxima: number;
  /** Abaixo deste valor a planta entra em "Crítico". */
  umidadeCritica: number;
  temperatura: number;
  canteiro: string;
  local: string;
  /** Chave do perfil de cultura (parâmetros ideais compartilhados). */
  culturaId: string;
  /** Data de plantio (AAAA-MM-DD). */
  dataPlantio: string;
  /** Queda média de umidade por hora (%/h) sem irrigação/chuva. Virá do histórico real dos sensores. */
  taxaSecagemHora: number;
  dataCadastro: string;
  ultimaIrrigacao: string;
}

export interface HistoricoPonto {
  hora: string;
  umidade: number;
}

export interface LeituraRecente {
  id: string;
  plantaNome: string;
  umidade: number;
  status: PlantStatus;
  horario: string;
}

// ---------- Irrigação ----------
export type IrrigacaoModo = 'automatico' | 'manual';
export type IrrigacaoEstado = 'ligada' | 'desligada';
export type IrrigacaoOrigem = 'automatica' | 'manual';

/** Estado de irrigação de uma planta/canteiro. */
export interface SessaoIrrigacao {
  estado: IrrigacaoEstado;
  modo: IrrigacaoModo;
  origem: IrrigacaoOrigem | null;
  decorridoMin: number;
  /** null = até ser desligada manualmente. */
  duracaoMin: number | null;
  motivo: string;
  umidadeAntes: number;
  /** Evita religar sozinha logo após o usuário parar manualmente com umidade ainda crítica. */
  bloqueioAuto: boolean;
}

export interface RegistroIrrigacao {
  id: string;
  plantaId: string;
  plantaNome: string;
  canteiro: string;
  timestamp: number;
  duracaoMin: number;
  modo: IrrigacaoOrigem;
  motivo: string;
  litros: number;
  /** Resposta do solo: umidade (%) antes e depois da irrigação. */
  umidadeAntes: number;
  umidadeDepois: number;
}

// ---------- Água ----------
export interface ConsumoDia {
  data: string;
  /** Início do dia (ms). */
  ts: number;
  umidadeMedia: number;
  plantasCriticas: number;
  alertas: number;
  utilizada: number;
  /** Estimativa do que uma irrigação convencional (horário fixo) gastaria. */
  convencional: number;
}

export interface ResumoConsumo {
  custo: number;
  economiaEstimada: number;
  utilizada: number;
  economizada: number;
  percentualEconomia: number;
}

// ---------- Sensores ----------
export type SensorTipo = 'umidade' | 'temperatura' | 'luminosidade' | 'nivel_agua' | 'temperatura_folha' | 'umidade_ar';

/** Placa que lê o sensor: define a escala do conversor analógico (Arduino 0–1023, ESP32 0–4095). */
export type PlacaSensor = 'arduino' | 'esp32';

/** Calibração de um sensor de umidade do solo (valores brutos do ADC). */
export interface Calibracao {
  placa: PlacaSensor;
  /** Leitura bruta com o sensor no ar (solo seco = 0%). */
  brutoSeco: number;
  /** Leitura bruta com o sensor na água (solo saturado = 100%). */
  brutoMolhado: number;
}
export type SensorStatus = 'online' | 'offline';

export interface Sensor {
  id: string;
  codigo: string;
  nome: string;
  tipo: SensorTipo;
  status: SensorStatus;
  valor: number;
  localizacao: string;
  /** Quando o sensor é de umidade, a planta que ele monitora. */
  plantaId?: string;
  /** Última leitura (ms). Só relevante para sensores offline. */
  ultimaLeituraMs?: number;
  /** Leitura bruta do ADC (só sensores de umidade do solo). */
  bruto?: number;
  calibracao?: Calibracao;
  /** Profundidade de instalação (cm) e posição, para comparar protótipos. */
  profundidadeCm?: number;
  posicao?: string;
  /** Há quantas horas a leitura não varia (usado na detecção de anomalias). */
  estavelHoras?: number;
}

// ---------- Alertas ----------
export type AlertaTipo =
  | 'umidade_critica'
  | 'umidade_baixa'
  | 'umidade_alta'
  | 'sensor_offline'
  | 'reservatorio_baixo'
  | 'irrigacao_iniciada'
  | 'irrigacao_concluida'
  | 'temperatura_elevada'
  | 'sensor_travado'
  | 'consumo_alto'
  | 'irrigacao_incomum'
  | 'estresse_hidrico';

export interface Alerta {
  id: string;
  tipo: AlertaTipo;
  severidade: PlantStatus;
  titulo: string;
  mensagem: string;
  plantaId?: string;
  criadoEm: number;
}

export type Periodo = '6h' | '12h' | '24h' | '7d';

// ---------- Cultura, clima e análises ----------
export interface Cultura {
  id: string;
  nome: string;
  temperaturaMin: number;
  temperaturaMax: number;
  luminosidadeMin: number;
  luminosidadeMax: number;
  /** Irrigações recomendadas por dia (ex.: 2 = duas vezes ao dia; 0.5 = a cada 2 dias). */
  irrigacoesPorDia: number;
  cicloDias: number;
}

export type CondicaoClima = 'ensolarado' | 'parcial' | 'nublado' | 'chuva';

export interface Clima {
  temperaturaAtual: number;
  maxima: number;
  minima: number;
  condicao: CondicaoClima;
  probabilidadeChuva: number;
  /** Horas até a chuva prevista (null = sem chuva prevista). */
  chuvaEmHoras: number | null;
}

export interface FotoPlanta {
  id: string;
  src: string;
  ts: number;
}

export interface Saude {
  nota: number;
  status: PlantStatus;
  rotulo: 'Saudável' | 'Atenção' | 'Crítico';
}

export interface Recomendacao {
  id: string;
  severidade: PlantStatus;
  rotulo: string;
  titulo: string;
  mensagem: string;
}

// ---------- Coleta de dados ----------
export type FaseLeitura = 'rotina' | 'antes' | 'durante' | 'depois';

export interface LeituraColetada {
  id: string;
  ts: number;
  plantaId: string;
  plantaNome: string;
  sensorCodigo: string;
  bruto: number;
  umidade: number;
  fase: FaseLeitura;
}
