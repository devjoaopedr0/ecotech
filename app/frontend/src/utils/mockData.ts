import type {
  Plant,
  HistoricoPonto,
  RegistroIrrigacao,
  ConsumoDia,
  Sensor,
  SessaoIrrigacao,
  Cultura,
  Clima,
  LeituraColetada,
  LeituraRecente,
  Periodo,
} from '../types';
import { formatarDataHora, formatarHora } from './format';
import { statusDaPlanta } from './umidade';
import { CALIBRACAO_PADRAO, idSensorUmidade, percentualParaBruto } from './calibracao';

/**
 * DADOS MOCKADOS — não há backend nem sensores reais conectados.
 * Tudo que está aqui deve ser substituído por chamadas à API (ver src/api).
 */

/** Vazão simulada de cada ponto de irrigação (litros por minuto). */
export const VAZAO_LITROS_POR_MIN = 2;

/** Tarifa de água simulada (R$ por m³). */
export const TARIFA_AGUA_M3 = 6.48;

const DIA = 24 * 60 * 60 * 1000;
const agoraMs = Date.now();

// id, nome, tipo, emoji, atual, faixa(min,max), mínima, máxima, crítica, temp, canteiro, plantio (dias atrás), secagem (%/h)
type Linha = [string, string, string, string, number, number, number, number, number, number, number, string, number, number];
const LINHAS: Linha[] = [
  ['1', 'Alface', 'Hortaliça', '🥬', 27, 50, 70, 45, 80, 40, 24.5, 'Canteiro 02', 25, 2.5],
  ['2', 'Manjericão', 'Erva aromática', '🌿', 35, 40, 60, 38, 75, 30, 26.1, 'Canteiro 03', 40, 2.5],
  ['3', 'Cebolinha', 'Hortaliça', '🌱', 71, 50, 70, 45, 80, 30, 25.3, 'Canteiro 04', 30, 1.2],
  ['4', 'Sálvia', 'Erva aromática', '🌿', 39, 40, 60, 40, 70, 25, 27.0, 'Canteiro 03', 55, 1.2],
  ['5', 'Tomate', 'Hortaliça', '🍅', 58, 50, 70, 45, 80, 30, 26.8, 'Canteiro 01', 15, 1.5],
  ['6', 'Hortelã', 'Erva aromática', '🌿', 54, 40, 60, 38, 75, 30, 25.9, 'Canteiro 05', 70, 2.0],
  ['7', 'Rúcula', 'Hortaliça', '🌱', 43, 40, 60, 38, 75, 30, 24.8, 'Canteiro 02', 12, 1.8],
  ['8', 'Coentro', 'Erva aromática', '🌿', 58, 50, 70, 45, 80, 30, 25.6, 'Canteiro 04', 20, 1.5],
];

/** Parâmetros por cultura (editáveis em Plantas). A chave é o id da cultura. */
export const culturasIniciais: Record<string, Cultura> = Object.fromEntries(
  (
    [
      ['alface', 'Alface', 15, 25, 10000, 25000, 2, 45],
      ['manjericao', 'Manjericão', 20, 30, 20000, 50000, 1, 75],
      ['cebolinha', 'Cebolinha', 15, 28, 15000, 40000, 1, 60],
      ['salvia', 'Sálvia', 18, 28, 20000, 50000, 0.5, 90],
      ['tomate', 'Tomate', 18, 28, 20000, 50000, 1, 60],
      ['hortela', 'Hortelã', 15, 27, 10000, 30000, 1, 90],
      ['rucula', 'Rúcula', 12, 26, 10000, 30000, 1, 40],
      ['coentro', 'Coentro', 15, 26, 15000, 35000, 1, 50],
    ] as [string, string, number, number, number, number, number, number][]
  ).map(([id, nome, temperaturaMin, temperaturaMax, luminosidadeMin, luminosidadeMax, irrigacoesPorDia, cicloDias]) => [
    id,
    { id, nome, temperaturaMin, temperaturaMax, luminosidadeMin, luminosidadeMax, irrigacoesPorDia, cicloDias },
  ])
);

/** Previsão do tempo SIMULADA (futuro: serviço meteorológico via backend). */
export const climaInicial: Clima = {
  temperaturaAtual: 27,
  maxima: 31,
  minima: 19,
  condicao: 'chuva',
  probabilidadeChuva: 85,
  chuvaEmHoras: 3,
};

function dataIsoDiasAtras(dias: number): string {
  const d = new Date(agoraMs - dias * DIA);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Histórico de irrigação: [dias atrás, hora, minuto, plantaId, duração (min), origem, motivo]
const SEMENTE_IRRIGACOES: [number, number, number, string, number, 'automatica' | 'manual', string][] = [
  [1, 19, 40, '1', 4, 'automatica', 'Umidade abaixo do nível crítico.'],
  [1, 18, 25, '2', 3, 'manual', 'Umidade abaixo do ideal.'],
  [1, 6, 10, '3', 2, 'manual', 'Acionamento manual.'],
  [2, 7, 32, '1', 3, 'automatica', 'Umidade abaixo do nível crítico.'],
  [2, 6, 15, '4', 3, 'manual', 'Umidade abaixo do ideal.'],
  [3, 18, 5, '5', 2, 'manual', 'Acionamento manual.'],
  [3, 7, 50, '8', 5, 'automatica', 'Umidade abaixo do nível crítico.'],
  [4, 17, 20, '7', 3, 'manual', 'Umidade abaixo do ideal.'],
];

function timestampDe(diasAtras: number, hora: number, minuto: number): number {
  const d = new Date(agoraMs - diasAtras * DIA);
  d.setHours(hora, minuto, 0, 0);
  return d.getTime();
}

export const historicoIrrigacaoInicial: RegistroIrrigacao[] = SEMENTE_IRRIGACOES.map(
  ([dias, h, m, plantaId, duracaoMin, modo, motivo], i) => {
    const linha = LINHAS.find((l) => l[0] === plantaId)!;
    const umidadeAntes = 26 + ((i * 7) % 11); // simulado: solo seco/crítico antes de irrigar
    return {
      id: `seed-${i + 1}`,
      plantaId,
      plantaNome: linha[1],
      canteiro: linha[11],
      timestamp: timestampDe(dias, h, m),
      duracaoMin,
      modo,
      motivo,
      litros: duracaoMin * VAZAO_LITROS_POR_MIN,
      umidadeAntes,
      umidadeDepois: Math.min(100, Math.round(umidadeAntes + duracaoMin * 2.2)),
    };
  }
).sort((a, b) => b.timestamp - a.timestamp);

export const plantasIniciais: Plant[] = LINHAS.map(
  ([id, nome, tipo, emoji, umidadeAtual, faixaMin, faixaMax, umidadeMinima, umidadeMaxima, umidadeCritica, temperatura, canteiro, plantioDias, taxaSecagemHora]) => {
    const ultima = historicoIrrigacaoInicial.find((r) => r.plantaId === id);
    return {
      id,
      nome,
      tipo,
      emoji,
      umidadeAtual,
      faixaMin,
      faixaMax,
      umidadeMinima,
      umidadeMaxima,
      umidadeCritica,
      temperatura,
      canteiro,
      local: 'Horta Principal',
      culturaId: nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      dataPlantio: dataIsoDiasAtras(plantioDias),
      taxaSecagemHora,
      dataCadastro: '08/09/2025',
      ultimaIrrigacao: ultima ? formatarDataHora(ultima.timestamp) : '--',
    };
  }
);

/** Estado inicial de irrigação por planta. Alface e Manjericão começam em modo manual para demonstrar as recomendações de irrigar. */
export const sessoesIniciais: Record<string, SessaoIrrigacao> = Object.fromEntries(
  LINHAS.map((l) => [
    l[0],
    {
      estado: 'desligada',
      modo: l[0] === '1' || l[0] === '2' ? 'manual' : 'automatico',
      origem: null,
      decorridoMin: 0,
      duracaoMin: null,
      motivo: '',
      umidadeAntes: 0,
      bloqueioAuto: false,
    } satisfies SessaoIrrigacao,
  ])
);

// ---------- Sensores ----------
const sensoresUmidade: Sensor[] = LINHAS.map((l, i) => ({
  id: `umi-${l[0]}`,
  codigo: String(i + 1).padStart(3, '0'),
  nome: `Sensor de Umidade #${String(i + 1).padStart(3, '0')}`,
  tipo: 'umidade',
  status: l[0] === '8' ? 'offline' : 'online',
  valor: l[4],
  localizacao: `${l[11]} · Horta Principal`,
  plantaId: l[0],
  bruto: percentualParaBruto(l[4], CALIBRACAO_PADRAO.esp32),
  calibracao: CALIBRACAO_PADRAO.esp32,
  profundidadeCm: l[0] === '5' ? 15 : 10,
  posicao: 'Próximo à raiz',
  ultimaLeituraMs: l[0] === '8' ? agoraMs - 47 * 60 * 1000 : undefined,
  estavelHoras: l[0] === '6' ? 14 : undefined,
}));

export const sensoresIniciais: Sensor[] = [
  ...sensoresUmidade,
  { id: 'tmp-1', codigo: '001', nome: 'Sensor de Temperatura #001', tipo: 'temperatura', status: 'online', valor: 27.4, localizacao: 'Horta Principal' },
  { id: 'tmp-2', codigo: '002', nome: 'Sensor de Temperatura #002', tipo: 'temperatura', status: 'online', valor: 33.4, localizacao: 'Estufa' },
  { id: 'fol-1', codigo: '001', nome: 'Sensor de Temperatura Foliar #001', tipo: 'temperatura_folha', status: 'online', valor: 26.4, localizacao: 'Canteiro 01 · Tomate' },
  { id: 'uar-1', codigo: '001', nome: 'Sensor de Umidade do Ar #001', tipo: 'umidade_ar', status: 'online', valor: 64, localizacao: 'Horta Principal' },
  { id: 'lum-1', codigo: '001', nome: 'Sensor de Luminosidade #001', tipo: 'luminosidade', status: 'online', valor: 18400, localizacao: 'Horta Principal' },
  { id: 'niv-1', codigo: '001', nome: 'Sensor de Nível da Água #001', tipo: 'nivel_agua', status: 'online', valor: 46, localizacao: 'Reservatório principal' },
];

// ---------- Consumo de água (litros) ----------
function rotuloDia(diasAtras: number): string {
  const d = new Date(agoraMs - diasAtras * DIA);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function inicioDoDia(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 30 dias de histórico diário simulado. O último é "hoje" e é atualizado pelas irrigações (e pelos valores ao vivo nos relatórios). */
const UTILIZADA_RECENTE = [41, 38, 45, 36, 42, 56, 0]; // últimos 7 dias; ontem acima da média
export const consumoInicial: ConsumoDia[] = Array.from({ length: 30 }, (_, i) => {
  const diasAtras = 29 - i;
  const ruido = (n: number) => ((diasAtras * 37 + n * 11) % 9) - 4;
  const utilizada = diasAtras <= 6 ? UTILIZADA_RECENTE[6 - diasAtras] : 38 + ruido(1) + 2;
  return {
    data: rotuloDia(diasAtras),
    ts: inicioDoDia(agoraMs - diasAtras * DIA),
    utilizada,
    convencional: 60,
    umidadeMedia: 52 + ruido(2),
    plantasCriticas: diasAtras % 9 === 3 ? 1 : 0,
    alertas: Math.max(0, 2 + (ruido(3) % 3)),
  };
});

// ---------- Leituras recentes (derivadas das plantas) ----------
export function gerarLeiturasRecentes(plantas: Plant[], sensores: Sensor[]): LeituraRecente[] {
  return plantas.slice(0, 8).map((p, i) => {
    const sensor = sensores.find((s) => s.plantaId === p.id);
    const quando = sensor?.status === 'offline' && sensor.ultimaLeituraMs ? sensor.ultimaLeituraMs : agoraMs - i * 5 * 60 * 1000;
    return {
      id: p.id,
      plantaNome: p.nome,
      umidade: p.umidadeAtual,
      status: statusDaPlanta(p),
      horario: formatarHora(quando),
    };
  });
}

// ---------- Histórico de umidade por planta (determinístico, termina na umidade atual) ----------
const PONTOS: Record<Periodo, { n: number; label: (i: number) => string }> = {
  '6h': { n: 7, label: (i) => `${String(i).padStart(2, '0')}:00` },
  '12h': { n: 7, label: (i) => `${String(i * 2).padStart(2, '0')}:00` },
  '24h': { n: 9, label: (i) => `${String(i * 3).padStart(2, '0')}:00` },
  '7d': { n: 7, label: (i) => `Dia ${i + 1}` },
};

function sementeDe(texto: string): number {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function gerarHistoricoPlanta(plantaId: string, atual: number, periodo: Periodo): HistoricoPonto[] {
  const { n, label } = PONTOS[periodo];
  const seed = sementeDe(plantaId + periodo);
  const onda = (i: number) => Math.sin((i + (seed % 7)) / 2) * 8 + (((seed >> (i % 16)) % 5) - 2);
  const ultimo = onda(n - 1);
  return Array.from({ length: n }, (_, i) => ({
    hora: label(i),
    umidade: Math.max(0, Math.min(100, Math.round(atual + onda(i) - ultimo))),
  }));
}

function gerarHistorico(pontos: number, base: number, amplitude: number, labelFn: (i: number) => string): HistoricoPonto[] {
  const out: HistoricoPonto[] = [];
  for (let i = 0; i < pontos; i++) {
    const val = Math.round(base + Math.sin(i / 2) * amplitude + (Math.random() - 0.5) * 4);
    out.push({ hora: labelFn(i), umidade: Math.max(0, Math.min(100, val)) });
  }
  return out;
}

export const historicoPorPeriodo: Record<string, HistoricoPonto[]> = {
  '6h': gerarHistorico(7, 58, 8, (i) => `${String(i).padStart(2, '0')}:00`),
  '12h': gerarHistorico(7, 55, 10, (i) => `${String(i * 2).padStart(2, '0')}:00`),
  '24h': gerarHistorico(9, 55, 12, (i) => `${String(i * 3).padStart(2, '0')}:00`),
  '7d': gerarHistorico(7, 55, 10, (i) => `Dia ${i + 1}`),
};

export const umidadeSemanal: HistoricoPonto[] = [
  { hora: '02/09', umidade: 48 },
  { hora: '03/09', umidade: 60 },
  { hora: '04/09', umidade: 58 },
  { hora: '05/09', umidade: 50 },
  { hora: '06/09', umidade: 68 },
  { hora: '07/09', umidade: 55 },
  { hora: '08/09', umidade: 64 },
];

// ---------- Leituras coletadas (últimas 12 h, a cada 2 h; simuladas) ----------
export const leiturasIniciais: LeituraColetada[] = plantasIniciais
  .filter((p) => p.id !== '8') // o sensor do Coentro está offline
  .flatMap((p) =>
    gerarHistoricoPlanta(p.id, p.umidadeAtual, '12h').map((pt, i, arr) => ({
      id: `seed-${p.id}-${i}`,
      ts: agoraMs - (arr.length - 1 - i) * 2 * 60 * 60 * 1000,
      plantaId: p.id,
      plantaNome: p.nome,
      sensorCodigo: sensoresIniciais.find((x) => x.id === idSensorUmidade(p.id))?.codigo ?? '',
      bruto: percentualParaBruto(pt.umidade, CALIBRACAO_PADRAO.esp32),
      umidade: pt.umidade,
      fase: 'rotina' as const,
    }))
  )
  .sort((a, b) => b.ts - a.ts);
