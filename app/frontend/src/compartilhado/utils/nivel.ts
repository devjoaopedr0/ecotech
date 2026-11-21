import type { NivelConhecimentoTecnologia, NivelDashboard } from '../types';
import { ROTAS, ROTAS_BASICO, ROTAS_INTER } from '../../routes/paths';

/** Quem ainda não tem nível definido continua vendo a dashboard completa (comportamento anterior do sistema). */
export const NIVEL_PADRAO: NivelDashboard = 'avancado';

/** Do mais simples ao mais completo (ordem das opções em Configurações). */
export const NIVEIS: NivelDashboard[] = ['basico', 'intermediario', 'avancado'];

export const ROTULO_NIVEL: Record<NivelDashboard, string> = { basico: 'Básico', intermediario: 'Intermediário', avancado: 'Avançado' };

export const DESCRICAO_NIVEL: Record<NivelDashboard, string> = {
  basico: 'Painel bem simples: como estão as plantas, o que fazer agora e um botão para regar.',
  intermediario: 'Painel simplificado para o acompanhamento diário.',
  avancado: 'Painel completo, com históricos, comparações e controles avançados.',
};

/** Porta de entrada de cada nível. */
export const ROTA_INICIAL: Record<NivelDashboard, string> = { basico: ROTAS_BASICO.inicio, intermediario: ROTAS_INTER.inicio, avancado: ROTAS.visaoGeral };

/** Configurações dentro de cada nível (mesma tela, layout do nível). */
export const ROTA_CONFIGURACOES: Record<NivelDashboard, string> = { basico: ROTAS_BASICO.configuracoes, intermediario: ROTAS_INTER.configuracoes, avancado: ROTAS.configuracoes };

/**
 * Resposta do cadastro -> dashboard. Muita familiaridade com tecnologia -> avançada; média -> intermediária;
 * pouca -> básica. Sem resposta, vale o padrão. Em todos os casos o usuário pode trocar depois em Configurações.
 */
export function nivelDoConhecimento(conhecimento: NivelConhecimentoTecnologia | ''): NivelDashboard {
  if (conhecimento === 'pouco') return 'basico';
  if (conhecimento === 'medio') return 'intermediario';
  return NIVEL_PADRAO;
}

export const ehNivel = (v: unknown): v is NivelDashboard => NIVEIS.includes(v as NivelDashboard);

/* ------------------------------------------------------------------ persistência (simulada, no navegador) */

/** usuário (minúsculas) -> nível. Guarda só o nível, nunca senha. Será substituído pelo perfil vindo do backend. */
const CHAVE_NIVEIS = 'ecotech-niveis';

function lerNiveis(): Record<string, NivelDashboard> {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_NIVEIS) ?? '{}') as Record<string, unknown>;
    return Object.fromEntries(Object.entries(bruto).filter((e): e is [string, NivelDashboard] => ehNivel(e[1])));
  } catch {
    return {};
  }
}

const chaveDoUsuario = (usuario: string) => usuario.trim().toLowerCase();

export function nivelSalvo(usuario: string): NivelDashboard {
  return lerNiveis()[chaveDoUsuario(usuario)] ?? NIVEL_PADRAO;
}

export function salvarNivel(usuario: string, nivel: NivelDashboard): void {
  if (!chaveDoUsuario(usuario)) return;
  try {
    localStorage.setItem(CHAVE_NIVEIS, JSON.stringify({ ...lerNiveis(), [chaveDoUsuario(usuario)]: nivel }));
  } catch {
    /* armazenamento indisponível: o nível vale só nesta sessão */
  }
}

/* ------------------------------------------------------------------ redirecionamento entre níveis */

/**
 * Telas equivalentes entre os níveis (quando existem). Quem abre uma tela de outro nível vai para a equivalente
 * no seu; sem equivalente, vai para o início do seu nível.
 */
const EQUIVALENTES: Partial<Record<NivelDashboard, string>>[] = [
  { avancado: ROTAS.plantas, intermediario: ROTAS_INTER.plantas, basico: ROTAS_BASICO.plantas },
  { avancado: ROTAS.monitor, intermediario: ROTAS_INTER.irrigacao },
  { avancado: ROTAS.configuracoes, intermediario: ROTAS_INTER.configuracoes, basico: ROTAS_BASICO.configuracoes },
];

/** Tira a barra final e trata o detalhe de uma planta (/intermediario/plantas/:id) como a lista de plantas. */
function normalizar(caminho: string): string {
  const semBarra = caminho.length > 1 ? caminho.replace(/\/+$/, '') : caminho;
  return semBarra.startsWith(`${ROTAS_INTER.plantas}/`) ? ROTAS_INTER.plantas : semBarra;
}

export function destinoNoNivel(caminho: string, nivel: NivelDashboard): string {
  const normalizado = normalizar(caminho);
  const grupo = EQUIVALENTES.find((g) => Object.values(g).includes(normalizado));
  return grupo?.[nivel] ?? ROTA_INICIAL[nivel];
}
