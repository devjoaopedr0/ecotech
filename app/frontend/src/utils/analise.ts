import type {
  Alerta,
  Clima,
  ConsumoDia,
  Cultura,
  Plant,
  Recomendacao,
  RegistroIrrigacao,
  ResumoConsumo,
  Saude,
  Sensor,
  SessaoIrrigacao,
} from '../types';
import { statusDaPlanta } from './umidade';

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;
const limitar = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));

// ---------------------------------------------------------------- previsão de umidade

/** Queda por hora ajustada pela temperatura (mais calor, mais evaporação). */
export function taxaSecagem(p: Plant): number {
  return p.taxaSecagemHora * (1 + Math.max(0, p.temperatura - 25) * 0.03);
}

export interface PontoPrevisao {
  horas: number;
  umidade: number;
  critico: boolean;
}

/** Previsão linear (sem considerar chuva) para as próximas horas. */
export function previsaoUmidade(p: Plant, horas = [0, 1, 2, 3]): PontoPrevisao[] {
  const taxa = taxaSecagem(p);
  return horas.map((h) => {
    const umidade = Math.max(0, Math.round(p.umidadeAtual - taxa * h));
    return { horas: h, umidade, critico: umidade < p.umidadeCritica };
  });
}

/** Horas até a umidade ficar abaixo do limite crítico; null se já está crítica. */
export function horasAteCritico(p: Plant): number | null {
  if (p.umidadeAtual < p.umidadeCritica) return null;
  const taxa = taxaSecagem(p);
  if (taxa <= 0) return null;
  return (p.umidadeAtual - p.umidadeCritica) / taxa;
}

export function textoHoras(h: number): string {
  return h < 1 ? 'menos de 1 hora' : `aproximadamente ${Math.round(h)} ${Math.round(h) === 1 ? 'hora' : 'horas'}`;
}

// ---------------------------------------------------------------- saúde da planta

const PESOS = { umidade: 0.5, temperatura: 0.2, luz: 0.15, irrigacao: 0.15 };

function pontuarFaixa(v: number, min: number, max: number): number {
  if (v >= min && v <= max) return 100;
  const dist = v < min ? min - v : v - max;
  const ref = Math.max(1, v < min ? min : max) * 0.5; // 50% de desvio => 0 pontos
  return limitar(100 - (dist / ref) * 100);
}

export function calcularSaude(p: Plant, c: Cultura | undefined, luminosidade: number | null, ultimaIrrigacaoMs: number | null, agora: number): Saude {
  let umidade: number;
  if (p.umidadeAtual < p.faixaMin) umidade = limitar(((p.umidadeAtual - p.umidadeCritica) / Math.max(1, p.faixaMin - p.umidadeCritica)) * 100);
  else if (p.umidadeAtual > p.faixaMax) umidade = 100 - 70 * limitar((p.umidadeAtual - p.faixaMax) / Math.max(1, p.umidadeMaxima - p.faixaMax), 0, 1);
  else umidade = 100;

  const temperatura = c ? pontuarFaixa(p.temperatura, c.temperaturaMin, c.temperaturaMax) : 100;
  const luz = c && luminosidade !== null ? pontuarFaixa(luminosidade, c.luminosidadeMin, c.luminosidadeMax) : 100;

  let irrigacao = 100;
  if (c && ultimaIrrigacaoMs !== null) {
    const intervalo = 24 / Math.max(0.1, c.irrigacoesPorDia); // horas
    const decorrido = (agora - ultimaIrrigacaoMs) / HORA;
    irrigacao = decorrido <= intervalo ? 100 : limitar(100 - ((decorrido - intervalo) / (2 * intervalo)) * 100);
  }

  const nota = Math.round(umidade * PESOS.umidade + temperatura * PESOS.temperatura + luz * PESOS.luz + irrigacao * PESOS.irrigacao);
  return nota >= 80
    ? { nota, status: 'ideal', rotulo: 'Saudável' }
    : nota >= 60
      ? { nota, status: 'atencao', rotulo: 'Atenção' }
      : { nota, status: 'critico', rotulo: 'Crítico' };
}

// ---------------------------------------------------------------- consumo e custo

export function calcularResumoConsumo(consumo: ConsumoDia[], tarifaM3: number): ResumoConsumo {
  const semana = consumo.slice(-7);
  const utilizada = semana.reduce((a, d) => a + d.utilizada, 0);
  const convencional = semana.reduce((a, d) => a + d.convencional, 0);
  const economizada = Math.max(0, convencional - utilizada);
  return {
    utilizada,
    economizada,
    percentualEconomia: convencional > 0 ? Math.round((economizada / convencional) * 100) : 0,
    custo: (utilizada / 1000) * tarifaM3,
    economiaEstimada: (economizada / 1000) * tarifaM3,
  };
}

export function formatarReais(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Variação (%) do consumo recente em relação à média dos dias anteriores. */
export function variacaoConsumo(consumo: ConsumoDia[]): number | null {
  const semana = consumo.slice(-7);
  if (semana.length < 4) return null;
  const base = semana.slice(0, -2);
  const media = base.reduce((a, d) => a + d.utilizada, 0) / base.length;
  const recente = Math.max(semana[semana.length - 2].utilizada, semana[semana.length - 1].utilizada);
  return media > 0 ? Math.round(((recente - media) / media) * 100) : null;
}

// ---------------------------------------------------------------- anomalias

export const LIMITE_CONSUMO_ALTO = 25; // %
export const LIMITE_SENSOR_TRAVADO_H = 12;
export const LIMITE_IRRIGACOES_6H = 4;

export function detectarAnomalias(plantas: Plant[], sensores: Sensor[], historico: RegistroIrrigacao[], consumo: ConsumoDia[], agora: number): Alerta[] {
  const out: Alerta[] = [];

  for (const s of sensores) {
    if (s.status === 'online' && s.estavelHoras && s.estavelHoras >= LIMITE_SENSOR_TRAVADO_H) {
      out.push({
        id: `travado-${s.id}`,
        tipo: 'sensor_travado',
        severidade: 'atencao',
        titulo: 'Possível problema no sensor',
        mensagem: `${s.nome}: a leitura permanece em ${s.valor}% há ${s.estavelHoras} horas sem alteração.`,
        plantaId: s.plantaId,
        criadoEm: agora, // anomalias aparecem antes dos demais alertas da mesma gravidade
      });
    }
  }

  const variacao = variacaoConsumo(consumo);
  if (variacao !== null && variacao >= LIMITE_CONSUMO_ALTO) {
    out.push({
      id: 'consumo-alto',
      tipo: 'consumo_alto',
      severidade: 'atencao',
      titulo: 'Consumo acima do normal',
      mensagem: `O consumo de água aumentou ${variacao}% em comparação com a média.`,
      criadoEm: agora, // anomalias aparecem antes dos demais alertas da mesma gravidade
    });
  }

  for (const p of plantas) {
    const recentes = historico.filter((r) => r.plantaId === p.id && agora - r.timestamp <= 6 * HORA);
    if (recentes.length >= LIMITE_IRRIGACOES_6H) {
      out.push({
        id: `incomum-${p.id}`,
        tipo: 'irrigacao_incomum',
        severidade: 'atencao',
        titulo: 'Irrigação incomum',
        mensagem: `O ${p.canteiro} (${p.nome}) recebeu ${recentes.length} irrigações nas últimas 6 horas.`,
        plantaId: p.id,
        criadoEm: agora, // anomalias aparecem antes dos demais alertas da mesma gravidade
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------- recomendações

/**
 * Regras (sem repetir os alertas): 1) irrigar plantas em modo manual que ficarão críticas em ≤ 3 h;
 * 2) adiar irrigação quando a chuva chega antes de a planta ficar crítica.
 * Plantas já críticas e anomalias são tratadas pelo sistema de alertas.
 */
export function gerarRecomendacoes(plantas: Plant[], sessoes: Record<string, SessaoIrrigacao | undefined>, clima: Clima): Recomendacao[] {
  const out: Recomendacao[] = [];
  const chuva = clima.chuvaEmHoras !== null && clima.probabilidadeChuva >= 60 ? clima.chuvaEmHoras : null;
  const adiar: string[] = [];

  for (const p of plantas) {
    const sessao = sessoes[p.id];
    if (sessao?.estado === 'ligada' || statusDaPlanta(p) === 'critico') continue;
    const h = horasAteCritico(p);
    const precisaAgua = statusDaPlanta(p) === 'atencao' && p.umidadeAtual < p.umidadeMinima;
    const choveAntes = chuva !== null && (h === null || chuva <= h);

    if (choveAntes && (precisaAgua || (h !== null && h <= 6))) {
      adiar.push(p.nome);
    } else if (h !== null && h <= 3 && sessao?.modo === 'manual') {
      out.push({
        id: `irrigar-${p.id}`,
        severidade: 'atencao',
        rotulo: 'Recomendação',
        titulo: 'Considere iniciar uma irrigação',
        mensagem: `A umidade do ${p.canteiro} (${p.nome}) está diminuindo ${taxaSecagem(p).toFixed(1).replace('.', ',')}% por hora e pode atingir o nível crítico em ${textoHoras(h)}.`,
      });
    }
  }

  if (adiar.length > 0 && chuva !== null) {
    out.unshift({
      id: 'economia-chuva',
      severidade: 'ideal',
      rotulo: 'Economia',
      titulo: 'Chuva prevista',
      mensagem: `Probabilidade de ${clima.probabilidadeChuva}% em cerca de ${chuva} h. A irrigação de ${adiar.join(', ')} pode ser adiada para reduzir o desperdício de água.`,
    });
  }
  return out.slice(0, 4);
}

// ---------------------------------------------------------------- eficiência

export interface Eficiencia {
  indice: number;
  pontoFraco: string;
}

export function calcularEficiencia(
  resumo: ResumoConsumo,
  saudes: Saude[],
  sensores: Sensor[],
  alertas: Alerta[],
  historico: RegistroIrrigacao[],
  agora: number
): Eficiencia {
  const saude = saudes.length ? saudes.reduce((a, s) => a + s.nota, 0) / saudes.length : 100;
  const sensoresOk = sensores.length ? (sensores.filter((s) => s.status === 'online').length / sensores.length) * 100 : 100;
  const graves = alertas.filter((a) => a.severidade === 'critico').length;
  const moderados = alertas.filter((a) => a.severidade === 'atencao').length;
  const semAlertas = limitar(100 - graves * 15 - moderados * 5);
  const semana = historico.filter((r) => agora - r.timestamp <= 7 * DIA);
  const inteligente = semana.length ? (semana.filter((r) => r.motivo !== 'Acionamento manual.').length / semana.length) * 100 : 100;

  const comp: [string, number, number][] = [
    ['economia de água', limitar(resumo.percentualEconomia * 2), 0.25],
    ['saúde das plantas', saude, 0.3],
    ['sensores em funcionamento', sensoresOk, 0.15],
    ['quantidade de alertas', semAlertas, 0.15],
    ['uso inteligente da água', inteligente, 0.15],
  ];
  const indice = Math.round(comp.reduce((a, [, v, w]) => a + v * w, 0));
  const pior = comp.reduce((m, c) => (c[1] < m[1] ? c : m));
  return { indice, pontoFraco: pior[0] };
}

// ---------------------------------------------------------------- colheita

export interface Colheita {
  plantio: number;
  previsao: number;
  diasRestantes: number;
}

export function calcularColheita(p: Plant, c: Cultura | undefined, agora: number): Colheita | null {
  if (!c || !p.dataPlantio) return null;
  const [y, m, d] = p.dataPlantio.split('-').map(Number);
  const plantio = new Date(y, m - 1, d).getTime();
  const previsao = plantio + c.cicloDias * DIA;
  return { plantio, previsao, diasRestantes: Math.ceil((previsao - agora) / DIA) };
}

// ---------------------------------------------------------------- relatórios

export interface Intervalo {
  inicio: number;
  fim: number;
}

export interface Relatorio {
  consumo: number;
  economizada: number;
  percentualEconomia: number;
  irrigacoes: number;
  irrigacoesAutomaticas: number;
  umidadeMedia: number | null;
  plantasCriticas: number;
  alertas: number;
  dias: ConsumoDia[];
}

export function gerarRelatorio(
  consumo: ConsumoDia[],
  historico: RegistroIrrigacao[],
  { inicio, fim }: Intervalo,
  hoje: { ts: number; umidadeMedia: number; criticas: number; alertas: number }
): Relatorio {
  // O dia de hoje usa os valores ao vivo; os anteriores, o histórico (simulado).
  const dias = consumo
    .filter((d) => d.ts >= inicio && d.ts <= fim)
    .map((d) => (d.ts === hoje.ts ? { ...d, umidadeMedia: hoje.umidadeMedia, plantasCriticas: hoje.criticas, alertas: hoje.alertas } : d));
  const usada = dias.reduce((a, d) => a + d.utilizada, 0);
  const conv = dias.reduce((a, d) => a + d.convencional, 0);
  const irrigacoes = historico.filter((r) => r.timestamp >= inicio && r.timestamp <= fim + DIA - 1);
  return {
    consumo: usada,
    economizada: Math.max(0, conv - usada),
    percentualEconomia: conv > 0 ? Math.round((Math.max(0, conv - usada) / conv) * 100) : 0,
    irrigacoes: irrigacoes.length,
    irrigacoesAutomaticas: irrigacoes.filter((r) => r.modo === 'automatica').length,
    umidadeMedia: dias.length ? Math.round(dias.reduce((a, d) => a + d.umidadeMedia, 0) / dias.length) : null,
    plantasCriticas: dias.reduce((m, d) => Math.max(m, d.plantasCriticas), 0),
    alertas: dias.reduce((a, d) => a + d.alertas, 0),
    dias,
  };
}

export function inicioDoDia(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
