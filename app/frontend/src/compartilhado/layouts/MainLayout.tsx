import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { LimiteDeErro, PaginaCarregando } from '../components/EstadosPagina';
import './MainLayout.css';

interface MainLayoutProps {
  /** Sidebar alternativa (recebe o fechamento do menu mobile). Padrão: menu da dashboard avançada. */
  renderSidebar?: (fecharMenu: () => void) => ReactNode;
  children: ReactNode | ((openMenu: () => void) => ReactNode);
}

/** Primeira abertura da sessão: mostra o esqueleto enquanto os dados iniciais são montados (será o tempo real da API). */
const CHAVE_CARREGADO = 'ecotech-carregado';
const TEMPO_PRIMEIRA_CARGA_MS = 450;

function usePrimeiraCarga() {
  const [carregando, setCarregando] = useState(() => {
    try {
      return sessionStorage.getItem(CHAVE_CARREGADO) !== '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!carregando) return;
    const t = setTimeout(() => {
      try { sessionStorage.setItem(CHAVE_CARREGADO, '1'); } catch { /* sem armazenamento: só não lembra */ }
      setCarregando(false);
    }, TEMPO_PRIMEIRA_CARGA_MS);
    return () => clearTimeout(t);
  }, [carregando]);
  return carregando;
}

export default function MainLayout({ children, renderSidebar }: MainLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const carregando = usePrimeiraCarga();
  const { pathname } = useLocation();

  // Esc fecha o menu no celular.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <div className="main-layout">
      <div className="bg-glow" aria-hidden="true" />
      <div className={`sidebar-shell ${mobileOpen ? 'sidebar-shell-open' : ''}`}>
        {renderSidebar ? renderSidebar(() => setMobileOpen(false)) : <Sidebar onNavigate={() => setMobileOpen(false)} />}
      </div>
      {mobileOpen && <div className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
      <main className="main-content" id="conteudo">
        {carregando ? (
          <PaginaCarregando />
        ) : (
          <LimiteDeErro chave={pathname}>{typeof children === 'function' ? children(() => setMobileOpen(true)) : children}</LimiteDeErro>
        )}
      </main>
    </div>
  );
}
