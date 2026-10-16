import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type {
  Alerta,
  Clima,
  ConsumoDia,
  Cultura,
  FotoPlanta,
  Calibracao,
  FaseLeitura,
  LeituraColetada,
  Recomendacao,
  Saude,
  IrrigacaoEstado,
  IrrigacaoModo,
  IrrigacaoOrigem,
  Plant,
  RegistroIrrigacao,
  ResumoConsumo,
  Sensor,
  SessaoIrrigacao,
} from '../types';
import {
  climaInicial,
  culturasIniciais,
  TARIFA_AGUA_M3,
  consumoInicial,
  historicoIrrigacaoInicial,
  leiturasIniciais,
  plantasIniciais,
  sensoresIniciais,
  sessoesIniciais,
  VAZAO_LITROS_POR_MIN,
} from '../utils/mockData';
import { statusDaPlanta as calcularStatus } from '../utils/umidade';
import { gerarAlertasDeEstado, ordenarAlertas } from '../utils/alertas';
import { formatarDataHora, formatarDiaMes } from '../utils/format';
import {
  calcularEficiencia,
  calcularResumoConsumo,
  calcularSaude,
  detectarAnomalias,
  gerarRecomendacoes,
  inicioDoDia,
  type Eficiencia,
} from '../utils/analise';
import { CALIBRACAO_PADRAO, brutoParaPercentual, idSensorUmidade, percentualParaBruto } from '../utils/calibracao';
import { ecotechApi } from '../api';

export const statusDaPlanta = calcularStatus;

/** Simulação: a cada passo (≈1,5 s reais) passa 1 minuto simulado e o solo ganha 2 pontos de umidade. */
const PASSO_MS = 1500;
const PASSO_UMIDADE = 2;
const LIMITE_AUTO_MIN = 20;
const CONVENCIONAL_DIA_L = 60;
const MAX_EVENTOS = 12;
const MAX_DIAS = 30;
const MAX_LEITURAS = 600;

const SESSAO_PADRAO: SessaoIrrigacao = {
  estado: 'desligada',
  modo: 'automatico',
  origem: null,
  decorridoMin: 0,
  duracaoMin: null,
  motivo: '',
  umidadeAntes: 0,
  bloqueioAuto: false,
};

// ---------------------------------------------------------------- estado

interface Estado {
  plantas: Plant[];
  sessoes: Record<string, SessaoIrrigacao>;
  historico: RegistroIrrigacao[];
  eventos: Alerta[];
  consumo: ConsumoDia[];
  culturas: Record<string, Cultura>;
  fotos: Record<string, FotoPlanta[]>;
  leituras: LeituraColetada[];
  /** Ajustes feitos pelo usuário sobre os sensores (calibração, profundidade, posição). */
  sensoresCfg: Record<string, SensorCfg>;
}

export interface SensorCfg {
  /** Leitura bruta preservada ao recalibrar (o bruto não muda; só a conversão para %). */
  bruto?: number;
  calibracao?: Calibracao;
  profundidadeCm?: number;
  posicao?: string;
}

type Acao =
  | { tipo: 'planta/atualizar'; id: string; dados: Partial<Plant> }
  | { tipo: 'planta/remover'; id: string }
  | { tipo: 'planta/adicionar'; planta: Plant }
  | { tipo: 'cultura/atualizar'; id: string; dados: Partial<Cultura> }
  | { tipo: 'foto/adicionar'; plantaId: string; foto: FotoPlanta }
  | { tipo: 'foto/remover'; plantaId: string; fotoId: string }
  | { tipo: 'sensor/configurar'; id: string; cfg: SensorCfg }
  | { tipo: 'leitura/registrar'; at: number }
  | { tipo: 'irrigacao/iniciar'; id: string; at: number; origem: IrrigacaoOrigem; duracaoMin: number | null }
  | { tipo: 'irrigacao/parar'; id: string; at: number }
  | { tipo: 'irrigacao/modo'; id: string; modo: IrrigacaoModo }
  | { tipo: 'irrigacao/passo'; at: number }
  | { tipo: 'irrigacao/auto'; at: number };

const estadoInicial: Estado = {
  plantas: plantasIniciais,
  sessoes: sessoesIniciais,
  historico: historicoIrrigacaoInicial,
  eventos: [],
  consumo: consumoInicial,
  culturas: culturasIniciais,
  fotos: {},
  leituras: leiturasIniciais,
  sensoresCfg: {},
};

const sessaoDe = (e: Estado, id: string): SessaoIrrigacao => e.sessoes[id] ?? SESSAO_PADRAO;
const rotulo = (p: Plant) => `${p.canteiro} (${p.nome})`;

/** Leitura bruta do sensor: usa o valor preservado enquanto ele for coerente com a umidade atual. */
function brutoDa(e: Pick<Estado, 'sensoresCfg'>, sensorId: string, pct: number): number {
  const cal = e.sensoresCfg[sensorId]?.calibracao ?? sensoresIniciais.find((s) => s.id === sensorId)?.calibracao ?? CALIBRACAO_PADRAO.esp32;
  const fixo = e.sensoresCfg[sensorId]?.bruto;
  return fixo !== undefined && brutoParaPercentual(fixo, cal) === pct ? fixo : percentualParaBruto(pct, cal);
}

/** Registra uma leitura (valor bruto + %) da planta, se o sensor dela estiver online. */
function comLeitura(e: Estado, planta: Plant, fase: FaseLeitura, at: number): Estado {
  const sensorId = idSensorUmidade(planta.id);
  const sensor = sensoresIniciais.find((s) => s.id === sensorId);
  if (!sensor || sensor.status !== 'online') return e;
  const leitura: LeituraColetada = {
    id: `${at}-${planta.id}-${fase}-${e.leituras.length}`,
    ts: at,
    plantaId: planta.id,
    plantaNome: planta.nome,
    sensorCodigo: sensor.codigo,
    bruto: brutoDa(e, sensorId, planta.umidadeAtual),
    umidade: planta.umidadeAtual,
    fase,
  };
  return { ...e, leituras: [leitura, ...e.leituras].slice(0, MAX_LEITURAS) };
}

function comEvento(e: Estado, ev: Alerta): Estado {
  return { ...e, eventos: [ev, ...e.eventos].slice(0, MAX_EVENTOS) };
}

function iniciar(e: Estado, id: string, at: number, origem: IrrigacaoOrigem, duracaoMin: number | null): Estado {
  const planta = e.plantas.find((p) => p.id === id);
  const atual = sessaoDe(e, id);
  if (!planta || atual.estado === 'ligada') return e;

  const status = calcularStatus(planta);
  const motivo =
    origem === 'automatica' || status === 'critico'
      ? 'Umidade abaixo do nível crítico.'
      : planta.umidadeAtual < planta.umidadeMinima
        ? 'Umidade abaixo do ideal.'
        : 'Acionamento manual.';

  const proximo: Estado = {
    ...e,
    sessoes: {
      ...e.sessoes,
      [id]: { ...atual, estado: 'ligada', origem, decorridoMin: 0, duracaoMin, motivo, umidadeAntes: planta.umidadeAtual, bloqueioAuto: false },
    },
  };
  return comEvento(comLeitura(proximo, planta, 'antes', at), {
    id: `ini-${at}-${id}`,
    tipo: 'irrigacao_iniciada',
    severidade: 'ideal',
    titulo: origem === 'automatica' ? 'Irrigação automática iniciada' : 'Irrigação iniciada',
    mensagem:
      origem === 'automatica'
        ? `Umidade crítica detectada no ${rotulo(planta)}: ${planta.umidadeAtual}%. Irrigação automática iniciada.`
        : `Irrigação manual iniciada no ${rotulo(planta)}.`,
    plantaId: id,
    criadoEm: at,
  });
}

function finalizar(e: Estado, id: string, at: number, bloquearAuto: boolean): Estado {
  const planta = e.plantas.find((p) => p.id === id);
  const sessao = sessaoDe(e, id);
  if (sessao.estado !== 'ligada') return e;

  const reset: SessaoIrrigacao = { ...sessao, estado: 'desligada', origem: null, decorridoMin: 0, duracaoMin: null, motivo: '', bloqueioAuto: bloquearAuto };
  if (!planta || sessao.decorridoMin === 0) {
    // Nada foi irrigado: não gera registro nem consumo.
    return { ...e, sessoes: { ...e.sessoes, [id]: reset } };
  }

  const litros = sessao.decorridoMin * VAZAO_LITROS_POR_MIN;
  const hoje = formatarDiaMes(at);
  const ultimoDia = e.consumo[e.consumo.length - 1];
  const consumo =
    ultimoDia && ultimoDia.data === hoje
      ? [...e.consumo.slice(0, -1), { ...ultimoDia, utilizada: ultimoDia.utilizada + litros }]
      : [
          ...e.consumo,
          {
            data: hoje,
            ts: inicioDoDia(at),
            utilizada: litros,
            convencional: CONVENCIONAL_DIA_L,
            umidadeMedia: Math.round(e.plantas.reduce((a, p) => a + p.umidadeAtual, 0) / Math.max(1, e.plantas.length)),
            plantasCriticas: e.plantas.filter((p) => calcularStatus(p) === 'critico').length,
            alertas: 0,
          },
        ].slice(-MAX_DIAS);

  const registro: RegistroIrrigacao = {
    id: `reg-${at}-${id}`,
    plantaId: id,
    plantaNome: planta.nome,
    canteiro: planta.canteiro,
    timestamp: at,
    duracaoMin: sessao.decorridoMin,
    modo: sessao.origem ?? 'manual',
    motivo: sessao.motivo,
    litros,
    umidadeAntes: sessao.umidadeAntes,
    umidadeDepois: planta.umidadeAtual,
  };

  const proximo: Estado = {
    ...e,
    sessoes: { ...e.sessoes, [id]: reset },
    historico: [registro, ...e.historico],
    consumo,
    plantas: e.plantas.map((p) => (p.id === id ? { ...p, ultimaIrrigacao: formatarDataHora(at) } : p)),
  };
  return comEvento(comLeitura(proximo, planta, 'depois', at), {
    id: `fim-${at}-${id}`,
    tipo: 'irrigacao_concluida',
    severidade: 'ideal',
    titulo: 'Irrigação concluída',
    mensagem: `${rotulo(planta)} irrigado por ${sessao.decorridoMin} min. Umidade atual: ${planta.umidadeAtual}%.`,
    plantaId: id,
    criadoEm: at,
  });
}

function reducer(e: Estado, a: Acao): Estado {
  switch (a.tipo) {
    case 'planta/atualizar':
      return { ...e, plantas: e.plantas.map((p) => (p.id === a.id ? { ...p, ...a.dados } : p)) };

    case 'planta/remover': {
      const { [a.id]: _removida, ...resto } = e.sessoes;
      return { ...e, plantas: e.plantas.filter((p) => p.id !== a.id), sessoes: resto };
    }

    case 'planta/adicionar':
      return { ...e, plantas: [...e.plantas, a.planta] };

    case 'cultura/atualizar':
      return { ...e, culturas: { ...e.culturas, [a.id]: { ...e.culturas[a.id], ...a.dados } } };

    case 'foto/adicionar':
      return { ...e, fotos: { ...e.fotos, [a.plantaId]: [...(e.fotos[a.plantaId] ?? []), a.foto].sort((x, y) => x.ts - y.ts) } };

    case 'leitura/registrar': {
      let proximo = e;
      for (const p of e.plantas) proximo = comLeitura(proximo, p, 'rotina', a.at);
      return proximo;
    }

    case 'sensor/configurar': {
      const sensor = sensoresIniciais.find((x) => x.id === a.id);
      const planta = sensor?.plantaId ? e.plantas.find((p) => p.id === sensor.plantaId) : undefined;
      const nova = a.cfg.calibracao;
      // O valor bruto do sensor não muda: guarda-o e recalcula a umidade da planta com a nova calibração.
      const bruto = planta && nova ? brutoDa(e, a.id, planta.umidadeAtual) : undefined;
      const proximo: Estado = {
        ...e,
        sensoresCfg: { ...e.sensoresCfg, [a.id]: { ...e.sensoresCfg[a.id], ...a.cfg, ...(bruto !== undefined ? { bruto } : {}) } },
      };
      if (!planta || !nova || bruto === undefined) return proximo;
      return { ...proximo, plantas: proximo.plantas.map((p) => (p.id === planta.id ? { ...p, umidadeAtual: brutoParaPercentual(bruto, nova) } : p)) };
    }

    case 'foto/remover':
      return { ...e, fotos: { ...e.fotos, [a.plantaId]: (e.fotos[a.plantaId] ?? []).filter((f) => f.id !== a.fotoId) } };

    case 'irrigacao/iniciar':
      return iniciar(e, a.id, a.at, a.origem, a.duracaoMin);

    case 'irrigacao/parar': {
      const planta = e.plantas.find((p) => p.id === a.id);
      // Se o usuário para com o solo ainda crítico, a automação não religa sozinha até a umidade se recuperar.
      return finalizar(e, a.id, a.at, !!planta && calcularStatus(planta) === 'critico');
    }

    case 'irrigacao/modo':
      return { ...e, sessoes: { ...e.sessoes, [a.id]: { ...sessaoDe(e, a.id), modo: a.modo } } };

    case 'irrigacao/passo': {
      let proximo = e;
      for (const id of Object.keys(e.sessoes)) {
        const sessao = proximo.sessoes[id];
        const planta = proximo.plantas.find((p) => p.id === id);
        if (!sessao || sessao.estado !== 'ligada' || !planta) continue;

        const umidadeAtual = Math.min(100, planta.umidadeAtual + PASSO_UMIDADE);
        const decorridoMin = sessao.decorridoMin + 1;
        proximo = {
          ...proximo,
          plantas: proximo.plantas.map((p) => (p.id === id ? { ...p, umidadeAtual } : p)),
          sessoes: { ...proximo.sessoes, [id]: { ...sessao, decorridoMin } },
        };

        const terminou =
          sessao.origem === 'automatica'
            ? umidadeAtual >= planta.faixaMin || decorridoMin >= LIMITE_AUTO_MIN
            : (sessao.duracaoMin !== null && decorridoMin >= sessao.duracaoMin) || umidadeAtual >= planta.umidadeMaxima;
        proximo = comLeitura(proximo, { ...planta, umidadeAtual }, 'durante', a.at);
        if (terminou) proximo = finalizar(proximo, id, a.at, false);
      }
      return proximo;
    }

    case 'irrigacao/auto': {
      let proximo = e;
      for (const planta of e.plantas) {
        const sessao = sessaoDe(proximo, planta.id);
        const critico = calcularStatus(planta) === 'critico';
        if (!critico && sessao.bloqueioAuto) {
          proximo = { ...proximo, sessoes: { ...proximo.sessoes, [planta.id]: { ...sessao, bloqueioAuto: false } } };
        } else if (critico && sessao.modo === 'automatico' && sessao.estado === 'desligada' && !sessao.bloqueioAuto) {
          proximo = iniciar(proximo, planta.id, a.at, 'automatica', null);
        }
      }
      return proximo;
    }
  }
}

// ---------------------------------------------------------------- contexto

interface PlantsContextValue {
  plantas: Plant[];
  atualizarPlanta: (id: string, dados: Partial<Plant>) => void;
  removerPlanta: (id: string) => void;
  adicionarPlanta: (dados: Omit<Plant, 'id' | 'dataCadastro' | 'ultimaIrrigacao'>) => void;
  plantaSelecionadaId: string;
  setPlantaSelecionadaId: (id: string) => void;

  // Irrigação da planta selecionada (usado pelo Monitor e pelo Apple Watch)
  irrigacaoEstado: IrrigacaoEstado;
  irrigacaoModo: IrrigacaoModo;
  ligarIrrigacao: () => void;
  desligarIrrigacao: () => void;
  setModoAutomatico: () => void;
  setModoManual: () => void;

  // Irrigação por planta
  sessaoDa: (id: string) => SessaoIrrigacao;
  iniciarIrrigacao: (id: string, duracaoMin?: number | null) => void;
  pararIrrigacao: (id: string) => void;
  definirModoIrrigacao: (id: string, modo: IrrigacaoModo) => void;
  algumaIrrigando: boolean;
  irrigacoesAtivas: number;

  sensores: Sensor[];
  alertas: Alerta[];

  // Inteligência (todas derivadas dos dados acima)
  agora: number;
  clima: Clima;
  tarifaM3: number;
  culturas: Record<string, Cultura>;
  atualizarCultura: (id: string, dados: Partial<Cultura>) => void;
  saudeDe: (plantaId: string) => Saude | undefined;
  recomendacoes: Recomendacao[];
  eficiencia: Eficiencia;
  leituras: LeituraColetada[];
  registrarLeituras: () => void;
  configurarSensor: (id: string, cfg: SensorCfg) => void;
  fotosDe: (plantaId: string) => FotoPlanta[];
  adicionarFoto: (plantaId: string, src: string) => void;
  removerFoto: (plantaId: string, fotoId: string) => void;
  historicoIrrigacao: RegistroIrrigacao[];
  consumo: ConsumoDia[];
  resumoConsumo: ResumoConsumo;
}

const PlantsContext = createContext<PlantsContextValue | undefined>(undefined);

export function PlantsProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial);
  const [plantaSelecionadaId, setPlantaSelecionadaId] = useState<string>(plantasIniciais[0].id);
  const { plantas, sessoes, historico, eventos, consumo, culturas, fotos } = estado;

  // Relógio do sistema (atualiza a cada minuto) — usado em saúde, colheita e anomalias.
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Se a planta selecionada for excluída, seleciona a primeira que restar.
  const selecionadaId = plantas.some((p) => p.id === plantaSelecionadaId) ? plantaSelecionadaId : (plantas[0]?.id ?? '');

  const algumaLigada = Object.values(sessoes).some((s) => s.estado === 'ligada');

  // Automação: sempre que os dados mudam, verifica umidade crítica nas plantas em modo automático.
  useEffect(() => {
    dispatch({ tipo: 'irrigacao/auto', at: Date.now() });
  }, [plantas, sessoes]);

  // Simulação da irrigação enquanto houver alguma ligada (substituir por leituras reais dos sensores via API).
  useEffect(() => {
    if (!algumaLigada) return;
    const timer = setInterval(() => dispatch({ tipo: 'irrigacao/passo', at: Date.now() }), PASSO_MS);
    return () => clearInterval(timer);
  }, [algumaLigada]);

  // Toda mudança ligada/desligada é comunicada ao serviço (hoje mock, amanhã API -> ESP32).
  const anterior = useRef(sessoes);
  useEffect(() => {
    for (const [id, s] of Object.entries(sessoes)) {
      const antes = anterior.current[id];
      if ((antes?.estado ?? 'desligada') === s.estado) continue;
      void ecotechApi
        .enviarComandoIrrigacao({
          plantaId: id,
          acao: s.estado === 'ligada' ? 'iniciar' : 'parar',
          origem: (s.origem ?? antes?.origem ?? 'manual') as IrrigacaoOrigem,
          duracaoMin: s.duracaoMin,
        })
        .catch(() => undefined);
    }
    anterior.current = sessoes;
  }, [sessoes]);

  const sensores = useMemo<Sensor[]>(
    () =>
      sensoresIniciais.flatMap((base) => {
        const s: Sensor = { ...base, ...estado.sensoresCfg[base.id] };
        if (!s.plantaId) return [s];
        const planta = plantas.find((p) => p.id === s.plantaId);
        if (!planta) return []; // planta excluída: o sensor deixa de ser exibido
        if (s.status !== 'online') return [s];
        // Se a umidade mudou (ex.: irrigação), a leitura deixa de estar "travada".
        const mudou = planta.umidadeAtual !== base.valor;
        return [{ ...s, valor: planta.umidadeAtual, bruto: brutoDa({ sensoresCfg: estado.sensoresCfg }, base.id, planta.umidadeAtual), estavelHoras: mudou ? undefined : s.estavelHoras }];
      }),
    [plantas, estado.sensoresCfg]
  );

  const alertas = useMemo(
    () =>
      ordenarAlertas([
        ...gerarAlertasDeEstado(plantas, sensores, sessoes),
        ...detectarAnomalias(plantas, sensores, historico, consumo, agora),
        ...eventos,
      ]),
    [plantas, sensores, sessoes, eventos, historico, consumo, agora]
  );

  const clima = climaInicial; // TODO API: previsão do tempo real
  const luminosidade = sensores.find((s) => s.tipo === 'luminosidade' && s.status === 'online')?.valor ?? null;
  const saudes = useMemo(() => {
    const out: Record<string, Saude> = {};
    for (const p of plantas) {
      const ultima = historico.find((r) => r.plantaId === p.id)?.timestamp ?? null;
      out[p.id] = calcularSaude(p, culturas[p.culturaId], luminosidade, ultima, agora);
    }
    return out;
  }, [plantas, culturas, luminosidade, historico, agora]);
  const recomendacoes = useMemo(() => gerarRecomendacoes(plantas, sessoes, clima), [plantas, sessoes, clima]);

  const resumoConsumo = useMemo<ResumoConsumo>(() => calcularResumoConsumo(consumo, TARIFA_AGUA_M3), [consumo]);
  const eficiencia = useMemo(
    () => calcularEficiencia(resumoConsumo, Object.values(saudes), sensores, alertas, historico, agora),
    [resumoConsumo, saudes, sensores, alertas, historico, agora]
  );

  const value = useMemo<PlantsContextValue>(() => {
    const sessaoDaPlanta = (id: string) => sessoes[id] ?? SESSAO_PADRAO;
    const iniciarIrrigacao = (id: string, duracaoMin: number | null = null) =>
      dispatch({ tipo: 'irrigacao/iniciar', id, at: Date.now(), origem: 'manual', duracaoMin });
    const pararIrrigacao = (id: string) => dispatch({ tipo: 'irrigacao/parar', id, at: Date.now() });
    const definirModoIrrigacao = (id: string, modo: IrrigacaoModo) => dispatch({ tipo: 'irrigacao/modo', id, modo });
    const selecionada = sessaoDaPlanta(selecionadaId);

    return {
      plantas,
      atualizarPlanta: (id, dados) => dispatch({ tipo: 'planta/atualizar', id, dados }),
      removerPlanta: (id) => dispatch({ tipo: 'planta/remover', id }),
      adicionarPlanta: (dados) =>
        dispatch({
          tipo: 'planta/adicionar',
          planta: { ...dados, id: crypto.randomUUID(), dataCadastro: new Date().toLocaleDateString('pt-BR'), ultimaIrrigacao: '--' },
        }),
      plantaSelecionadaId: selecionadaId,
      setPlantaSelecionadaId,

      irrigacaoEstado: selecionada.estado,
      irrigacaoModo: selecionada.modo,
      ligarIrrigacao: () => iniciarIrrigacao(selecionadaId),
      desligarIrrigacao: () => pararIrrigacao(selecionadaId),
      setModoAutomatico: () => definirModoIrrigacao(selecionadaId, 'automatico'),
      setModoManual: () => definirModoIrrigacao(selecionadaId, 'manual'),

      sessaoDa: sessaoDaPlanta,
      iniciarIrrigacao,
      pararIrrigacao,
      definirModoIrrigacao,
      algumaIrrigando: algumaLigada,
      irrigacoesAtivas: Object.values(sessoes).filter((s) => s.estado === 'ligada').length,

      sensores,
      alertas,
      historicoIrrigacao: historico,
      consumo,
      resumoConsumo,

      agora,
      clima,
      tarifaM3: TARIFA_AGUA_M3,
      culturas,
      atualizarCultura: (id, dados) => dispatch({ tipo: 'cultura/atualizar', id, dados }),
      saudeDe: (id) => saudes[id],
      recomendacoes,
      eficiencia,
      leituras: estado.leituras,
      registrarLeituras: () => dispatch({ tipo: 'leitura/registrar', at: Date.now() }),
      configurarSensor: (id, cfg) => {
        dispatch({ tipo: 'sensor/configurar', id, cfg });
        if (cfg.calibracao) void ecotechApi.salvarCalibracao(id, cfg.calibracao).catch(() => undefined);
      },
      fotosDe: (id) => fotos[id] ?? [],
      adicionarFoto: (plantaId, src) =>
        dispatch({ tipo: 'foto/adicionar', plantaId, foto: { id: `${Date.now()}-${plantaId}`, src, ts: Date.now() } }),
      removerFoto: (plantaId, fotoId) => dispatch({ tipo: 'foto/remover', plantaId, fotoId }),
    };
  }, [plantas, sessoes, selecionadaId, algumaLigada, sensores, alertas, historico, consumo, resumoConsumo, agora, clima, culturas, saudes, recomendacoes, eficiencia, fotos, estado.leituras]);

  return <PlantsContext.Provider value={value}>{children}</PlantsContext.Provider>;
}

export function usePlants() {
  const ctx = useContext(PlantsContext);
  if (!ctx) throw new Error('usePlants deve ser usado dentro de PlantsProvider');
  return ctx;
}
