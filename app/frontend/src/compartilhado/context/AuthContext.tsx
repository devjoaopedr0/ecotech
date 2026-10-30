import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { aoExpirarSessao, ApiError, ecotechApi, type Usuario } from '../api';
import type { NivelDashboard } from '../types';
import { NIVEL_PADRAO, ehNivel, nivelSalvo, salvarNivel } from '../utils/nivel';

interface AuthContextValue {
  isAuthenticated: boolean;
  /** Nome de exibição do usuário. */
  usuario: string;
  email: string;
  /** Dashboard do usuário (definido no cadastro e alterável em Configurações). */
  nivel: NivelDashboard;
  definirNivel: (nivel: NivelDashboard) => void;
  /** Resolve com null se entrou, ou com a mensagem de erro. */
  login: (email: string, senha: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const CHAVE_NIVEL = 'ecotech-nivel';

function lerNivelDaSessao(): NivelDashboard {
  try {
    const guardado = sessionStorage.getItem(CHAVE_NIVEL);
    return ehNivel(guardado) ? guardado : NIVEL_PADRAO;
  } catch {
    return NIVEL_PADRAO;
  }
}

function guardarNivelNaSessao(nivel: NivelDashboard | null): void {
  try {
    if (nivel) sessionStorage.setItem(CHAVE_NIVEL, nivel);
    else sessionStorage.removeItem(CHAVE_NIVEL);
  } catch {
    // sem storage, o nível vale até recarregar a página
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => ecotechApi.usuarioAtual());
  const [nivel, setNivel] = useState<NivelDashboard>(lerNivelDaSessao);

  const encerrar = useCallback(() => {
    setUsuario(null);
    setNivel(NIVEL_PADRAO);
    guardarNivelNaSessao(null);
  }, []);

  const logout = useCallback(() => {
    ecotechApi.sair();
    encerrar();
  }, [encerrar]);

  // Refresh token vencido ou senha trocada em outro lugar: volta para o login.
  useEffect(() => aoExpirarSessao(encerrar), [encerrar]);

  const login = useCallback(async (email: string, senha: string) => {
    try {
      const entrou = await ecotechApi.entrar(email.trim(), senha);
      // O nível fica guardado pelo e-mail (o mesmo informado no cadastro).
      const nivelDoUsuario = nivelSalvo(entrou.email);
      setUsuario(entrou);
      setNivel(nivelDoUsuario);
      guardarNivelNaSessao(nivelDoUsuario);
      return null;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return 'E-mail ou senha incorretos.';
      return e instanceof Error ? e.message : 'Não foi possível entrar.';
    }
  }, []);

  const definirNivel = useCallback(
    (novo: NivelDashboard) => {
      setNivel(novo);
      guardarNivelNaSessao(novo);
      if (usuario) salvarNivel(usuario.email, novo);
    },
    [usuario]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: usuario !== null,
      usuario: usuario?.nome ?? '',
      email: usuario?.email ?? '',
      nivel,
      definirNivel,
      login,
      logout,
    }),
    [usuario, nivel, definirNivel, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
