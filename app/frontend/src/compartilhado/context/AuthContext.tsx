import { createContext, useContext, useState, type ReactNode } from 'react';
import type { NivelDashboard } from '../types';
import { NIVEL_PADRAO, ehNivel, nivelSalvo, salvarNivel } from '../utils/nivel';

interface AuthContextValue {
  isAuthenticated: boolean;
  usuario: string;
  /** Dashboard do usuário (definido no cadastro e alterável em Configurações). */
  nivel: NivelDashboard;
  definirNivel: (nivel: NivelDashboard) => void;
  login: (usuario: string, senha: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('ecotech-auth') === 'true';
  });
  const [usuario, setUsuario] = useState<string>(() => sessionStorage.getItem('ecotech-user') || '');
  const [nivel, setNivel] = useState<NivelDashboard>(() => {
    const guardado = sessionStorage.getItem('ecotech-nivel');
    return ehNivel(guardado) ? guardado : NIVEL_PADRAO;
  });

  const login = (usuarioInput: string, _senha: string) => {
    // Autenticação simulada: qualquer usuário/senha preenchidos são aceitos.
    if (!usuarioInput.trim()) return false;
    const nivelDoUsuario = nivelSalvo(usuarioInput);
    setIsAuthenticated(true);
    setUsuario(usuarioInput);
    setNivel(nivelDoUsuario);
    sessionStorage.setItem('ecotech-auth', 'true');
    sessionStorage.setItem('ecotech-user', usuarioInput);
    sessionStorage.setItem('ecotech-nivel', nivelDoUsuario);
    return true;
  };

  const definirNivel = (novo: NivelDashboard) => {
    setNivel(novo);
    sessionStorage.setItem('ecotech-nivel', novo);
    salvarNivel(usuario, novo);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsuario('');
    setNivel(NIVEL_PADRAO);
    sessionStorage.removeItem('ecotech-auth');
    sessionStorage.removeItem('ecotech-user');
    sessionStorage.removeItem('ecotech-nivel');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, usuario, nivel, definirNivel, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
