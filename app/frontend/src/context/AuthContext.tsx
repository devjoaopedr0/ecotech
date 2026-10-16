import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { aoExpirarSessao, ApiError, ecotechApi, type Usuario } from '../api';

interface AuthContextValue {
  isAuthenticated: boolean;
  /** Nome de exibição do usuário. */
  usuario: string;
  email: string;
  /** Resolve com null se entrou, ou com a mensagem de erro. */
  login: (email: string, senha: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => ecotechApi.usuarioAtual());

  const logout = useCallback(() => {
    ecotechApi.sair();
    setUsuario(null);
  }, []);

  // Refresh token vencido ou senha trocada em outro lugar: volta para o login.
  useEffect(() => aoExpirarSessao(() => setUsuario(null)), []);

  const login = useCallback(async (email: string, senha: string) => {
    try {
      setUsuario(await ecotechApi.entrar(email.trim(), senha));
      return null;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return 'E-mail ou senha incorretos.';
      return e instanceof Error ? e.message : 'Não foi possível entrar.';
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated: usuario !== null, usuario: usuario?.nome ?? '', email: usuario?.email ?? '', login, logout }),
    [usuario, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
