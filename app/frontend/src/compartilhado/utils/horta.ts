import type { Alerta, ConsumoDia, Cultura, LeituraColetada, Plant, PlantStatus, Sensor, SensorTipo } from '../types';
import { avaliarLeituraDaPlanta } from './sensores';
import { statusDaPlanta } from './umidade';

/* ------------------------------------------------------------------ períodos */

export type PeriodoId = '24h' | '7d' | '14d' | '30d';

export const PERIODOS: { id: PeriodoId; rotulo: string; curto: string; ms: number; dias: number }[] = [
  { id: '24h', rotulo: 'Últimas 24 horas', curto: '24 horas', ms: 24 * 3_600_000, dias: 1 },
  { id: '7d', rotulo: 'Últimos 7 dias', curto: '7 dias', ms: 7 * 86_400_000, dias: 7 },
  { id: '14d', rotulo: 'Últimos 14 dias', curto: '14 dias', ms: 14 * 86_400_000, dias: 14 },
  { id: '30d', rotulo: 'Últimos 30 dias', curto: '30 dias', ms: 30 * 86_400_000, dias: 30 },
];

/** Períodos da visão simplificada (intermediária). A avançada oferece também 14 dias. */
export const PERIODOS_BASICOS = PERIODOS.filter((p) => p.id !== '14d');

export const periodoPorId = (id: PeriodoId) => PERIODOS.find((p) => p.id === id) ?? PERIODOS[0];

/* ------------------------------------------------------------------ estado da planta */

export type EstadoPlanta = 'saudavel' | 'atencao' | 'critico' | 'sem_dados';

export const ROTULO_ESTADO: Record<EstadoPlanta, string> = {
  saudavel: 'Saudável',
  atencao: 'Atenção',
  critico: 'Crítico',
  sem_dados: 'Sem dados suficientes',
};

export interface PlantaMonitorada {
  planta: Plant;
  estado: EstadoPlanta;
  sensor?: Sensor;
  /** Instante da última leitura conhecida; null quando o sistema não tem registro. */
  ultimaLeituraMs: number | null;
  /** Por que o estado foi atribuído (mostra os números que sustentam a classificação). */
  motivo: string;
  /** Orientação de cuidado sustentada pelos dados; nunca sugere irrigar sem leitura confiável. */
  recomendacao: string;
  /** Aviso extra quando a temperatura está fora da faixa configurada para a cultura. */
  avisoTemperatura: string | null;
}

export function ultimaLeituraDaPlanta(plantaId: string, leituras: LeituraColetada[]): number | null {
  let ultimo: number | null = null;
  for (const l of leituras) if (l.plantaId === plantaId && (ultimo === null || l.ts > ultimo)) ultimo = l.ts;
  return ultimo;
}

function avisoDeTemperatura(planta: Plant, cultura?: Cultura): string | null {
  if (!cultura) return null;
  const t = planta.temperatura;
  const faixa = `${cultura.temperaturaMin}–${cultura.temperaturaMax} °C`;
  if (t > cultura.temperaturaMax) return `Temperatura de ${t.toFixed(1)} °C acima da faixa da cultura (${faixa}).`;
  if (t < cultura.temperaturaMin) return `Temperatura de ${t.toFixed(1)} °C abaixo da faixa da cultura (${faixa}).`;
  return null;
}

/**
 * Classifica a planta com as regras do sistema (utils/umidade.ts).
 * Leitura offline, travada, inválida ou desatualizada (utils/sensores.ts) => "sem dados": ausência de alerta não significa saúde.
 */
export function diagnosticarPlanta(planta: Plant, sensores: Sensor[], leituras: LeituraColetada[], culturas: Record<string, Cultura>, agora: number): PlantaMonitorada {
  const sensor = sensores.find((s) => s.id === `umi-${planta.id}`);
  const avaliacao = avaliarLeituraDaPlanta(planta, sensores, leituras, agora);
  const registrada = ultimaLeituraDaPlanta(planta.id, leituras);
  const avisoTemperatura = avisoDeTemperatura(planta, culturas[planta.culturaId]);
  const base = { planta, sensor, avisoTemperatura };

  if (!avaliacao.confiavel) {
    return {
      ...base,
      estado: 'sem_dados',
      ultimaLeituraMs: avaliacao.ultimaMs ?? registrada,
      motivo: avaliacao.situacao === 'ausente' ? 'Nenhum sensor de umidade associado a esta planta.' : avaliacao.detalhe,
      recomendacao: 'Não há leitura confiável. Verifique o sensor antes de decidir sobre a irrigação.',
    };
  }

  const u = planta.umidadeAtual;
  const status = statusDaPlanta(planta);
  const limites = `${planta.umidadeMinima}–${planta.umidadeMaxima}%`;

  if (status === 'critico') {
    return { ...base, estado: 'critico', ultimaLeituraMs: registrada, motivo: `Umidade de ${u}%, abaixo do limite crítico (${planta.umidadeCritica}%).`, recomendacao: 'Verifique o canteiro e irrigue assim que possível.' };
  }
  if (u < planta.umidadeMinima) {
    return { ...base, estado: 'atencao', ultimaLeituraMs: registrada, motivo: `Umidade de ${u}%, abaixo do mínimo (${planta.umidadeMinima}%).`, recomendacao: 'O solo está secando. Acompanhe e planeje a irrigação.' };
  }
  if (u > planta.umidadeMaxima) {
    return { ...base, estado: 'atencao', ultimaLeituraMs: registrada, motivo: `Umidade de ${u}%, acima do máximo (${planta.umidadeMaxima}%).`, recomendacao: 'Solo muito úmido. Evite irrigar e verifique a drenagem.' };
  }
  return { ...base, estado: 'saudavel', ultimaLeituraMs: registrada, motivo: `Umidade de ${u}%, dentro dos limites configurados (${limites}).`, recomendacao: 'Nenhuma ação necessária no momento.' };
}

export function contarPorEstado(lista: PlantaMonitorada[]): Record<EstadoPlanta, number> {
  const out: Record<EstadoPlanta, number> = { saudavel: 0, atencao: 0, critico: 0, sem_dados: 0 };
  for (const p of lista) out[p.estado]++;
  return out;
}

/** Mais urgentes primeiro: crítico, atenção, sem dados, saudável. */
const ORDEM_ESTADO: Record<EstadoPlanta, number> = { critico: 0, atencao: 1, sem_dados: 2, saudavel: 3 };
export const porUrgencia = (a: PlantaMonitorada, b: PlantaMonitorada) => ORDEM_ESTADO[a.estado] - ORDEM_ESTADO[b.estado] || a.planta.nome.localeCompare(b.planta.nome, 'pt-BR');

/* ------------------------------------------------------------------ indicadores */

export interface Indicadores {
  totalPlantas: number;
  saudaveis: number;
  atencao: number;
  criticas: number;
  semDados: number;
  /** Média da umidade só das plantas com leitura confiável; null quando nenhuma tem. */
  umidadeMedia: number | null;
  umidadeMinima: number | null;
  umidadeMaxima: number | null;
  plantasComLeitura: number;
  /** Leitura mais recente entre as plantas com leitura confiável (ms). */
  ultimaLeituraMs: number | null;
  temperatura: { media: number; min: number; max: number; sensores: number } | null;
  alertasAtivos: number;
  alertasCriticos: number;
  dispositivos: { online: number; offline: number; total: number };
}

export function calcularIndicadores(monitoradas: PlantaMonitorada[], sensores: Sensor[], alertas: Alerta[]): Indicadores {
  const comLeitura = monitoradas.filter((m) => m.estado !== 'sem_dados');
  const umidades = comLeitura.map((m) => m.planta.umidadeAtual);
  const temps = sensores.filter((s) => s.tipo === 'temperatura' && s.status === 'online').map((s) => s.valor);
  const contagem = contarPorEstado(monitoradas);
  const online = sensores.filter((s) => s.status === 'online').length;
  const leituras = comLeitura.map((m) => m.ultimaLeituraMs).filter((v): v is number => v !== null);
  const ativos = alertas.filter(alertaRequerAcao);
  return {
    totalPlantas: monitoradas.length,
    saudaveis: contagem.saudavel,
    atencao: contagem.atencao,
    criticas: contagem.critico,
    semDados: contagem.sem_dados,
    umidadeMedia: umidades.length ? Math.round(umidades.reduce((a, b) => a + b, 0) / umidades.length) : null,
    umidadeMinima: umidades.length ? Math.min(...umidades) : null,
    umidadeMaxima: umidades.length ? Math.max(...umidades) : null,
    plantasComLeitura: comLeitura.length,
    ultimaLeituraMs: leituras.length ? Math.max(...leituras) : null,
    temperatura: temps.length ? { media: temps.reduce((a, b) => a + b, 0) / temps.length, min: Math.min(...temps), max: Math.max(...temps), sensores: temps.length } : null,
    alertasAtivos: ativos.length,
    alertasCriticos: ativos.filter((a) => a.severidade === 'critico').length,
    dispositivos: { online, offline: sensores.length - online, total: sensores.length },
  };
}

export type NivelHorta = 'ok' | 'atencao' | 'critico';

export interface SituacaoHorta {
  nivel: NivelHorta;
  titulo: string;
  texto: string;
}

/** Situação geral da horta: a mesma regra e os mesmos textos nas duas dashboards. */
export function situacaoDaHorta(ind: Indicadores): SituacaoHorta {
  if (ind.totalPlantas === 0) return { nivel: 'atencao', titulo: 'Sem plantas cadastradas', texto: 'Cadastre plantas para acompanhar a horta.' };
  if (ind.criticas > 0) return { nivel: 'critico', titulo: 'Horta em estado crítico', texto: `${ind.criticas} planta(s) com umidade crítica.` };
  if (ind.alertasAtivos > 0) return { nivel: 'atencao', titulo: 'Horta requer atenção', texto: 'Há alertas que precisam ser verificados.' };
  return { nivel: 'ok', titulo: 'Horta saudável', texto: 'Tudo funcionando normalmente.' };
}

/* ------------------------------------------------------------------ alertas */

export type Prioridade = 'alta' | 'media' | 'informativa';
export const ROTULO_PRIORIDADE: Record<Prioridade, string> = { alta: 'Alta', media: 'Média', informativa: 'Informativa' };

export const prioridadeDoAlerta = (severidade: PlantStatus): Prioridade => (severidade === 'critico' ? 'alta' : severidade === 'ideal' ? 'informativa' : 'media');

/** Eventos como "irrigação iniciada" são informativos e não contam como problema. */
export const alertaRequerAcao = (a: Alerta) => a.severidade !== 'ideal';

/* ------------------------------------------------------------------ sensores */

export const ROTULO_TIPO_SENSOR: Record<SensorTipo, string> = {
  umidade: 'Umidade do solo',
  temperatura: 'Temperatura',
  luminosidade: 'Luminosidade',
  nivel_agua: 'Nível da água',
  temperatura_folha: 'Temperatura foliar',
  umidade_ar: 'Umidade do ar',
};

export const UNIDADE_TIPO_SENSOR: Record<SensorTipo, string> = {
  umidade: '%',
  temperatura: '°C',
  luminosidade: 'lx',
  nivel_agua: '%',
  temperatura_folha: '°C',
  umidade_ar: '%',
};

export function formatarValorSensor(tipo: SensorTipo, valor: number): string {
  const unidade = UNIDADE_TIPO_SENSOR[tipo];
  const numero = tipo === 'temperatura' || tipo === 'temperatura_folha' ? valor.toFixed(1) : valor.toLocaleString('pt-BR');
  return unidade === '%' ? `${numero}%` : `${numero} ${unidade}`;
}

/* ------------------------------------------------------------------ séries e medições */

export interface PontoSerie {
  ts: number;
  valor: number;
  /** Média da horta no mesmo instante (só quando uma planta específica está selecionada). */
  comparacao?: number;
}

export interface SerieUmidade {
  pontos: PontoSerie[];
  /** 'leitura': pontos reais de leitura; 'dia': média diária. */
  granularidade: 'leitura' | 'dia';
  /** Planta pedida, mas o período não tem histórico por planta. */
  indisponivelParaPlanta: boolean;
}

const media = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;

/**
 * Umidade do solo no período.
 *  - 24 h: leituras registradas (por planta, ou média da horta usando só as leituras de rotina).
 *  - 7 e 30 dias: média diária da horta (única série diária que o sistema guarda). Não existe histórico diário por planta.
 */
export function serieUmidade(periodo: PeriodoId, leituras: LeituraColetada[], consumo: ConsumoDia[], agora: number, plantaId?: string): SerieUmidade {
  if (periodo !== '24h') {
    const dias = periodoPorId(periodo).dias;
    const pontos = consumo.slice(-dias).map((d) => ({ ts: d.ts, valor: d.umidadeMedia }));
    return { pontos, granularidade: 'dia', indisponivelParaPlanta: !!plantaId };
  }

  const desde = agora - periodoPorId('24h').ms;
  const porInstante = (lista: LeituraColetada[]) => {
    const mapa = new Map<number, number[]>();
    for (const l of lista) mapa.set(l.ts, [...(mapa.get(l.ts) ?? []), l.umidade]);
    return mapa;
  };
  const janela = leituras.filter((l) => l.ts >= desde);
  const hortaPorTs = porInstante(janela.filter((l) => l.fase === 'rotina'));
  const alvo = plantaId ? porInstante(janela.filter((l) => l.plantaId === plantaId)) : hortaPorTs;

  const pontos = [...alvo.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ts, v]) => ({
      ts,
      valor: Math.round(media(v)),
      comparacao: plantaId && hortaPorTs.has(ts) ? Math.round(media(hortaPorTs.get(ts)!)) : undefined,
    }));
  return { pontos, granularidade: 'leitura', indisponivelParaPlanta: false };
}

export const ROTULO_FASE: Record<LeituraColetada['fase'], string> = {
  rotina: 'Leitura de rotina',
  antes: 'Antes da irrigação',
  durante: 'Durante a irrigação',
  depois: 'Depois da irrigação',
};

export interface Medicao {
  id: string;
  ts: number;
  plantaId?: string;
  plantaNome: string;
  sensorCodigo: string;
  tipo: SensorTipo;
  valor: number;
  unidade: string;
  /** Estado da leitura segundo os limites atuais da planta; null quando não há limites para comparar. */
  estado: PlantStatus | null;
  contexto: string;
}

/** Única fonte de medições com horário hoje: as leituras de umidade do solo (LeituraColetada). */
export function medicoesDeUmidade(leituras: LeituraColetada[], plantas: Plant[]): Medicao[] {
  return leituras
    .map((l) => {
      const p = plantas.find((x) => x.id === l.plantaId);
      return {
        id: l.id,
        ts: l.ts,
        plantaId: l.plantaId,
        plantaNome: l.plantaNome,
        sensorCodigo: l.sensorCodigo,
        tipo: 'umidade' as const,
        valor: l.umidade,
        unidade: '%',
        estado: p ? statusDaPlanta({ ...p, umidadeAtual: l.umidade }) : null,
        contexto: ROTULO_FASE[l.fase],
      };
    })
    .sort((a, b) => b.ts - a.ts);
}

/** Variação (em pontos percentuais) entre a primeira e a última leitura da série; null com menos de 2 pontos. */
export function variacaoDaSerie(pontos: PontoSerie[]): number | null {
  if (pontos.length < 2) return null;
  return pontos[pontos.length - 1].valor - pontos[0].valor;
}

/* ------------------------------------------------------------------ última leitura por planta */

export interface UltimaLeitura {
  planta: Plant;
  /** Medição mais recente registrada para a planta; null quando o sistema não tem nenhuma. */
  medicao: Medicao | null;
}

/** Uma linha por planta com a leitura realmente registrada (valor e horário reais), sem inventar horário para quem não tem. */
export function ultimasLeituras(leituras: LeituraColetada[], plantas: Plant[]): UltimaLeitura[] {
  const medicoes = medicoesDeUmidade(leituras, plantas); // já ordenadas da mais recente para a mais antiga
  return plantas.map((planta) => ({ planta, medicao: medicoes.find((m) => m.plantaId === planta.id) ?? null }));
}

/* ------------------------------------------------------------------ tendência medida */

export type DirecaoTendencia = 'queda' | 'alta' | 'estavel' | 'inconclusiva';

export interface TendenciaMedida {
  direcao: DirecaoTendencia;
  /** Inclinação da reta ajustada às leituras (pontos percentuais por hora). */
  taxaPorHora: number | null;
  /** Variação entre a primeira e a última leitura da janela (p.p.). */
  variacao: number | null;
  leituras: number;
  janelaHoras: number;
  /** Qualidade do ajuste (0–1). */
  r2: number | null;
  /** Estimativa de horas até o limite crítico, só quando a queda é consistente. É uma estimativa, não uma previsão garantida. */
  horasAteCritico: number | null;
  /** Por que não foi possível concluir (dados insuficientes, ajuste fraco etc.). */
  limitacao: string | null;
}

export const TENDENCIA_MIN_LEITURAS = 4;
export const TENDENCIA_MIN_JANELA_H = 4;
export const TENDENCIA_MIN_R2 = 0.6;
/** Variação por hora abaixo da qual a umidade é considerada estável (ruído de leitura). */
export const TENDENCIA_LIMIAR_ESTAVEL = 0.3;
export const TENDENCIA_JANELA_MS = 12 * 3_600_000;
export const TENDENCIA_HORIZONTE_MAX_H = 48;

/**
 * Tendência da umidade da planta nas últimas 12 h, por regressão linear das leituras de rotina.
 * Só conclui com leituras suficientes, janela mínima e ajuste razoável; fora disso devolve "inconclusiva" e explica o motivo.
 * A estimativa de tempo até o limite crítico usa a inclinação medida (não a taxa de secagem cadastrada) e ignora chuva e irrigação futuras.
 */
export function tendenciaDaPlanta(planta: Plant, leituras: LeituraColetada[], agora: number): TendenciaMedida {
  const pontos = leituras
    .filter((l) => l.plantaId === planta.id && l.fase === 'rotina' && l.ts >= agora - TENDENCIA_JANELA_MS && l.ts <= agora)
    .sort((a, b) => a.ts - b.ts);
  const n = pontos.length;
  const janelaHoras = n >= 2 ? (pontos[n - 1].ts - pontos[0].ts) / 3_600_000 : 0;
  const vazio = (limitacao: string): TendenciaMedida => ({ direcao: 'inconclusiva', taxaPorHora: null, variacao: n >= 2 ? pontos[n - 1].umidade - pontos[0].umidade : null, leituras: n, janelaHoras, r2: null, horasAteCritico: null, limitacao });

  if (n < TENDENCIA_MIN_LEITURAS) return vazio(`Apenas ${n} leitura(s) nas últimas 12 h; são necessárias ${TENDENCIA_MIN_LEITURAS}.`);
  if (janelaHoras < TENDENCIA_MIN_JANELA_H) return vazio(`As leituras cobrem só ${janelaHoras.toFixed(1).replace('.', ',')} h; são necessárias ${TENDENCIA_MIN_JANELA_H} h.`);

  const x = pontos.map((p) => (p.ts - pontos[0].ts) / 3_600_000);
  const y = pontos.map((p) => p.umidade);
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  const sxx = x.reduce((a, v) => a + (v - mx) ** 2, 0);
  const sxy = x.reduce((a, v, i) => a + (v - mx) * (y[i] - my), 0);
  const syy = y.reduce((a, v) => a + (v - my) ** 2, 0);
  const taxa = sxx === 0 ? 0 : sxy / sxx;
  const r2 = syy === 0 ? 1 : (sxy * sxy) / (sxx * syy);
  const variacao = y[n - 1] - y[0];
  const base = { taxaPorHora: taxa, variacao, leituras: n, janelaHoras, r2 };

  if (Math.abs(taxa) < TENDENCIA_LIMIAR_ESTAVEL) return { ...base, direcao: 'estavel', horasAteCritico: null, limitacao: null };
  if (r2 < TENDENCIA_MIN_R2) return { ...base, direcao: 'inconclusiva', horasAteCritico: null, limitacao: `As leituras oscilam sem direção clara (ajuste ${Math.round(r2 * 100)}%, mínimo ${TENDENCIA_MIN_R2 * 100}%).` };

  if (taxa > 0) return { ...base, direcao: 'alta', horasAteCritico: null, limitacao: null };
  const horas = (planta.umidadeAtual - planta.umidadeCritica) / -taxa;
  return { ...base, direcao: 'queda', horasAteCritico: planta.umidadeAtual > planta.umidadeCritica && horas <= TENDENCIA_HORIZONTE_MAX_H ? horas : null, limitacao: null };
}

/* ------------------------------------------------------------------ comparação entre períodos */

export interface MetricaComparada {
  atual: number;
  anterior: number;
  /** atual − anterior, na unidade da métrica. */
  variacao: number;
  /** Variação percentual sobre o anterior; null quando o anterior é zero. */
  variacaoPct: number | null;
}

export interface ComparacaoPeriodos {
  dias: number;
  umidadeMedia: MetricaComparada;
  aguaUtilizada: MetricaComparada;
  diasComPlantaCritica: MetricaComparada;
  alertas: MetricaComparada;
}

const comparar = (atual: number, anterior: number): MetricaComparada => ({
  atual,
  anterior,
  variacao: Math.round((atual - anterior) * 10) / 10,
  variacaoPct: anterior === 0 ? null : Math.round(((atual - anterior) / anterior) * 100),
});

const soma = (v: number[]) => v.reduce((a, b) => a + b, 0);

/**
 * Compara os últimos `dias` dias completos com os `dias` imediatamente anteriores (mesma duração).
 * O dia de hoje fica de fora porque está incompleto e distorceria consumo e contagens. Null quando o histórico não cobre os dois períodos.
 */
export function compararPeriodos(consumo: ConsumoDia[], dias: number): ComparacaoPeriodos | null {
  const completos = consumo.slice(0, -1);
  if (completos.length < dias * 2) return null;
  const atual = completos.slice(-dias);
  const anterior = completos.slice(-dias * 2, -dias);
  const media = (lista: ConsumoDia[]) => Math.round(soma(lista.map((d) => d.umidadeMedia)) / lista.length);
  return {
    dias,
    umidadeMedia: comparar(media(atual), media(anterior)),
    aguaUtilizada: comparar(soma(atual.map((d) => d.utilizada)), soma(anterior.map((d) => d.utilizada))),
    diasComPlantaCritica: comparar(atual.filter((d) => d.plantasCriticas > 0).length, anterior.filter((d) => d.plantasCriticas > 0).length),
    alertas: comparar(soma(atual.map((d) => d.alertas)), soma(anterior.map((d) => d.alertas))),
  };
}
