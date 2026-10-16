import type {
  Calibracao,
  Clima,
  ConsumoDia,
  Cultura,
  IrrigacaoModo,
  LeituraColetada,
  Plant,
  RegistroIrrigacao,
  Sensor,
  SessaoIrrigacao,
} from '../types';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
}

export interface PreferenciasNotificacao {
  horta: boolean;
  email: boolean;
  sistema: boolean;
}

/** Tudo que as telas da horta precisam, carregado de uma vez. */
export interface DadosHorta {
  plantas: Plant[];
  sessoes: Record<string, SessaoIrrigacao>;
  sensores: Sensor[];
  culturas: Record<string, Cultura>;
  historico: RegistroIrrigacao[];
  consumo: ConsumoDia[];
  tarifaM3: number;
  leituras: LeituraColetada[];
}

/** Campos da planta que o usuário edita. */
export type DadosPlanta = Partial<
  Pick<
    Plant,
    'nome' | 'tipo' | 'emoji' | 'canteiro' | 'local' | 'culturaId' | 'dataPlantio' | 'faixaMin' | 'faixaMax' | 'umidadeMinima' | 'umidadeMaxima' | 'umidadeCritica'
  >
>;

export interface AjustesSensor {
  calibracao?: Calibracao;
  profundidadeCm?: number;
  posicao?: string;
}

/**
 * Contrato entre as telas e o backend, no vocabulário do front. As telas e
 * os contextos só conhecem esta interface: trocar a simulação pela API real
 * (ou por outro transporte) não muda nenhuma tela.
 */
export interface EcotechApi {
  /** true na implementação simulada: o PlantsContext roda a simulação local. */
  readonly simulado: boolean;

  entrar(email: string, senha: string): Promise<Usuario>;
  sair(): void;
  usuarioAtual(): Usuario | null;
  trocarSenha(senhaAtual: string, novaSenha: string): Promise<void>;
  obterNotificacoes(): Promise<PreferenciasNotificacao>;
  salvarNotificacoes(dados: Partial<PreferenciasNotificacao>): Promise<PreferenciasNotificacao>;

  carregarHorta(): Promise<DadosHorta>;
  atualizarPlanta(plantaId: string, dados: DadosPlanta): Promise<void>;
  removerPlanta(plantaId: string): Promise<void>;
  criarPlanta(dados: DadosPlanta): Promise<void>;
  atualizarCultura(culturaId: string, dados: Partial<Omit<Cultura, 'id'>>): Promise<void>;
  /** A placa envia só o valor bruto; a calibração seco/molhado fica no sistema. */
  ajustarSensor(sensor: Sensor, ajustes: AjustesSensor): Promise<void>;

  /** O backend repassa o comando à placa na resposta da próxima leitura. */
  iniciarIrrigacao(plantaId: string, duracaoMin: number | null): Promise<void>;
  pararIrrigacao(plantaId: string): Promise<void>;
  definirModoIrrigacao(plantaId: string, modo: IrrigacaoModo): Promise<void>;

  /** Ainda sem backend: a implementação HTTP devolve a previsão simulada. */
  obterPrevisaoTempo(): Promise<Clima>;
}
