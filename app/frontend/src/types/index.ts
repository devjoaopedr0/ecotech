export type PlantStatus = 'ideal' | 'atencao' | 'abaixo';

export interface Plant {
  id: string;
  nome: string;
  tipo: string;
  emoji: string;
  umidadeAtual: number;
  faixaMin: number;
  faixaMax: number;
  local: string;
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

export interface RelatorioIrrigacao {
  id: string;
  plantaNome: string;
  data: string;
  hora: string;
}

export type IrrigacaoModo = 'automatico' | 'manual';
export type IrrigacaoEstado = 'ligada' | 'desligada';

export type Periodo = '6h' | '12h' | '24h' | '7d';
