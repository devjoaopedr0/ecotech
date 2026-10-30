import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../compartilhado/context/AuthContext';
import { destinoNoNivel } from '../compartilhado/utils/nivel';
import type { NivelDashboard } from '../compartilhado/types';

/**
 * Cada nível enxerga só as telas da própria dashboard. Quem abre uma tela do outro nível
 * (link antigo, favorito, digitando a URL) vai para a tela equivalente do seu nível, ou para o início dele.
 */
export default function RotaDoNivel({ nivel, children }: { nivel: NivelDashboard; children: ReactNode }) {
  const { nivel: nivelDoUsuario } = useAuth();
  const { pathname } = useLocation();
  if (nivelDoUsuario !== nivel) return <Navigate to={destinoNoNivel(pathname, nivelDoUsuario)} replace />;
  return <>{children}</>;
}
