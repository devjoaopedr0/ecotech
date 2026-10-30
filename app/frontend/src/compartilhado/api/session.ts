/**
 * Tokens da sessão. Ficam no sessionStorage (somem ao fechar a aba) e o
 * acesso ao storage é protegido, porque ele pode lançar em modo privado ou
 * com cookies bloqueados.
 *
 * O ideal é o refresh token ir num cookie httpOnly emitido pelo backend,
 * fora do alcance de scripts; enquanto o backend devolver os tokens no corpo,
 * este módulo é o único lugar que os guarda.
 */
export interface Sessao {
  accessToken: string;
  refreshToken: string;
  usuario: { id: string; nome: string; email: string };
}

const CHAVE = 'ecotech-sessao';

export function lerSessao(): Sessao | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as Sessao) : null;
  } catch {
    return null;
  }
}

export function salvarSessao(sessao: Sessao): void {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(sessao));
  } catch {
    // Sem storage a sessão vale só até recarregar a página.
  }
  memoria = sessao;
}

export function limparSessao(): void {
  try {
    sessionStorage.removeItem(CHAVE);
  } catch {
    // ignora
  }
  memoria = null;
}

let memoria: Sessao | null = lerSessao();

/** Sessão atual (memória primeiro, para funcionar mesmo sem storage). */
export const sessaoAtual = (): Sessao | null => memoria;

// Avisa quem estiver ouvindo (AuthContext) que a sessão expirou de vez.
const ouvintes = new Set<() => void>();
export function aoExpirarSessao(fn: () => void): () => void {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}
export function notificarSessaoExpirada(): void {
  limparSessao();
  ouvintes.forEach((fn) => fn());
}
