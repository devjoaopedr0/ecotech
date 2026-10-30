import type { AuthResponseDto, ErrorBodyDto } from './dto';
import { ENDPOINTS } from './endpoints';
import { notificarSessaoExpirada, salvarSessao, sessaoAtual } from './session';

/** Erro de uma chamada à API, com a mensagem do backend quando houver. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface Opcoes {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  corpo?: unknown;
  consulta?: Record<string, string | number | boolean | undefined>;
  /** false nas rotas públicas (login, refresh). */
  autenticado?: boolean;
}

const TEMPO_LIMITE_MS = 15_000;

export const apiBaseUrl = (): string | undefined =>
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || undefined;

function montarUrl(base: string, caminho: string, consulta?: Opcoes['consulta']): string {
  const url = new URL(`${base}${caminho}`);
  for (const [chave, valor] of Object.entries(consulta ?? {})) {
    if (valor !== undefined) url.searchParams.set(chave, String(valor));
  }
  return url.toString();
}

async function mensagemDeErro(resposta: Response): Promise<string> {
  try {
    const corpo = (await resposta.json()) as Partial<ErrorBodyDto>;
    const msg = Array.isArray(corpo.message) ? corpo.message.join(' ') : corpo.message;
    if (msg) return msg;
  } catch {
    // corpo vazio ou não-JSON
  }
  return `Falha na API (${resposta.status}).`;
}

async function enviar(caminho: string, { metodo = 'GET', corpo, consulta, autenticado = true }: Opcoes): Promise<Response> {
  const base = apiBaseUrl();
  if (!base) throw new ApiError(0, 'VITE_API_URL não está definido.');
  const token = autenticado ? sessaoAtual()?.accessToken : undefined;

  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    return await fetch(montarUrl(base, caminho, consulta), {
      method: metodo,
      headers: {
        ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: controle.signal,
    });
  } catch {
    throw new ApiError(0, controle.signal.aborted ? 'A API demorou demais para responder.' : 'Não foi possível conectar à API.');
  } finally {
    clearTimeout(timer);
  }
}

// Várias requisições podem receber 401 ao mesmo tempo: todas esperam o mesmo
// refresh em vez de cada uma gastar o refresh token.
let renovando: Promise<boolean> | null = null;

function renovarSessao(): Promise<boolean> {
  renovando ??= (async () => {
    const sessao = sessaoAtual();
    if (!sessao) return false;
    const resposta = await enviar(ENDPOINTS.refresh, {
      metodo: 'POST',
      corpo: { refreshToken: sessao.refreshToken },
      autenticado: false,
    }).catch(() => null);
    if (!resposta?.ok) return false;
    const dados = (await resposta.json()) as AuthResponseDto;
    salvarSessao({
      accessToken: dados.accessToken,
      refreshToken: dados.refreshToken,
      usuario: { id: dados.user.id, nome: dados.user.name, email: dados.user.email },
    });
    return true;
  })().finally(() => {
    renovando = null;
  });
  return renovando;
}

/**
 * Faz a requisição e devolve o JSON. Com o access token vencido (401), renova
 * a sessão uma vez e repete; se o refresh também falhar, encerra a sessão.
 */
export async function requisitar<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  let resposta = await enviar(caminho, opcoes);
  if (resposta.status === 401 && opcoes.autenticado !== false) {
    if (await renovarSessao()) {
      resposta = await enviar(caminho, opcoes);
    }
    if (resposta.status === 401) {
      notificarSessaoExpirada();
    }
  }
  if (!resposta.ok) throw new ApiError(resposta.status, await mensagemDeErro(resposta));
  return resposta.status === 204 ? (undefined as T) : ((await resposta.json()) as T);
}
