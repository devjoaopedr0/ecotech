/** Cliente HTTP mínimo (fetch). Usa VITE_API_URL e, se existir, VITE_API_KEY. */
export class ApiError extends Error {
  status: number;
  /** Corpo JSON da resposta de erro, quando houver (ex.: { campo: 'email', mensagem: '...' }). */
  detalhe?: unknown;

  constructor(status: number, message: string, detalhe?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detalhe = detalhe;
  }
}

export interface Opcoes {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  corpo?: unknown;
}

export const apiBaseUrl = (): string | undefined => (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || undefined;

export async function requisitar<T>(caminho: string, { metodo = 'GET', corpo }: Opcoes = {}): Promise<T> {
  const base = apiBaseUrl();
  if (!base) throw new ApiError(0, 'VITE_API_URL não está definido.');

  const chave = import.meta.env.VITE_API_KEY as string | undefined;
  const resposta = await fetch(`${base}${caminho}`, {
    method: metodo,
    headers: {
      ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(chave ? { Authorization: `Bearer ${chave}` } : {}),
    },
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });
  if (!resposta.ok) {
    const detalhe = await resposta.json().catch(() => undefined);
    throw new ApiError(resposta.status, `Falha na API (${resposta.status}) em ${caminho}`, detalhe);
  }
  return resposta.status === 204 ? (undefined as T) : ((await resposta.json()) as T);
}
