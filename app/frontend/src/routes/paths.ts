/** Caminhos de todas as telas. Único lugar onde as URLs do app são definidas. */
export const ROTAS = {
  login: '/login',
  cadastro: '/cadastro',
  visaoGeral: '/',
  dashboard: '/dashboard',
  monitor: '/monitor',
  plantas: '/plantas',
  sensores: '/sensores',
  relatorios: '/relatorios',
  configuracoes: '/configuracoes',
  /** Porta de entrada da dashboard intermediária (use este caminho para linkar a partir do cadastro). */
  intermediario: '/intermediario',
  /** Porta de entrada da dashboard básica. */
  basico: '/basico',
} as const;

/** Telas da dashboard básica. Todas ficam sob /basico. */
export const ROTAS_BASICO = {
  inicio: '/basico',
  plantas: '/basico/plantas',
  configuracoes: '/basico/configuracoes',
} as const;

/** Telas da dashboard intermediária. Todas ficam sob /intermediario. */
export const ROTAS_INTER = {
  inicio: '/intermediario',
  plantas: '/intermediario/plantas',
  /** Detalhe de uma planta: limites, gráfico, irrigação e recomendações. Use `ROTAS_INTER.planta(id)` para linkar. */
  plantaDetalhe: '/intermediario/plantas/:plantaId',
  planta: (id: string) => `/intermediario/plantas/${encodeURIComponent(id)}`,
  /** Acompanhamento e controle básico da irrigação, planta a planta. */
  irrigacao: '/intermediario/irrigacao',
  monitoramento: '/intermediario/monitoramento',
  /** Descontinuadas na intermediária (conteúdo duplicado ou avançado): redirecionam, ver ROTAS_INTER_REDIRECIONADAS. */
  graficos: '/intermediario/graficos',
  historico: '/intermediario/historico',
  alertas: '/intermediario/alertas',
  dispositivos: '/intermediario/dispositivos',
  configuracoes: '/intermediario/configuracoes',
} as const;

/** Endereços antigos da intermediária que continuam funcionando (favoritos e links): vão para a tela que absorveu o conteúdo essencial. */
export const ROTAS_INTER_REDIRECIONADAS: { de: string; para: string }[] = [
  { de: ROTAS_INTER.graficos, para: ROTAS_INTER.inicio },
  { de: ROTAS_INTER.historico, para: ROTAS_INTER.plantas },
  { de: ROTAS_INTER.monitoramento, para: ROTAS_INTER.plantas },
  { de: ROTAS_INTER.dispositivos, para: ROTAS_INTER.inicio },
];
