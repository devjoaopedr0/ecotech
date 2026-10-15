import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthContextValue {
  isAuthenticated: boolean;
  usuario: string;
  login: (usuario: string, senha: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('ecotech-auth') === 'true';
  });
  const [usuario, setUsuario] = useState<string>(() => sessionStorage.getItem('ecotech-user') || '');

  const login = (usuarioInput: string, _senha: string) => {
    // Autenticação simulada: qualquer usuário/senha preenchidos são aceitos.
    if (!usuarioInput.trim()) return false;
    setIsAuthenticated(true);
    setUsuario(usuarioInput);
    sessionStorage.setItem('ecotech-auth', 'true');
    sessionStorage.setItem('ecotech-user', usuarioInput);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsuario('');
    sessionStorage.removeItem('ecotech-auth');
    sessionStorage.removeItem('ecotech-user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
