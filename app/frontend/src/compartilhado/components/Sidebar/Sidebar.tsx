import type { ReactNode, SVGProps } from 'react';
import { ROTAS } from '../../../routes/paths';
import { NavLink } from 'react-router-dom';
import { HomeIcon, DashboardIcon, DropletIcon, LeafIcon, WifiIcon, DocumentIcon, GearIcon } from '../icons';
import './Sidebar.css';

export interface NavItem {
  to: string;
  label: string;
  icon: (p: SVGProps<SVGSVGElement>) => ReactNode;
  end?: boolean;
  /** Contador exibido ao lado do rótulo (ex.: alertas ativos). */
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { to: ROTAS.visaoGeral, label: 'Visão Geral', icon: HomeIcon, end: true },
  { to: ROTAS.dashboard, label: 'Dashboard', icon: DashboardIcon },
  { to: ROTAS.monitor, label: 'Monitor', icon: DropletIcon },
  { to: ROTAS.plantas, label: 'Plantas', icon: LeafIcon },
  { to: ROTAS.sensores, label: 'Sensores', icon: WifiIcon },
  { to: ROTAS.relatorios, label: 'Relatórios', icon: DocumentIcon },
  { to: ROTAS.configuracoes, label: 'Configurações', icon: GearIcon },
];

interface SidebarProps {
  onNavigate?: () => void;
  /** Itens do menu; por padrão, o menu da dashboard avançada. */
  items?: NavItem[];
  /** Conteúdo fixo no fim do menu (ex.: perfil do usuário). */
  footer?: ReactNode;
}

export default function Sidebar({ onNavigate, items = NAV_ITEMS, footer }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
          <path d="M6 21c0-10 8-16 24-16 0 15-7 24-17 24-4 0-7-2-7-8Z" stroke="url(#g1)" strokeWidth="2.2" fill="none" />
          <path d="M11 30c4-6 9-12 17-17" stroke="url(#g1)" strokeWidth="2.2" strokeLinecap="round" />
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="42" y2="42">
              <stop offset="0" stopColor="#22c55e" />
              <stop offset="1" stopColor="#2fb6f0" />
            </linearGradient>
          </defs>
        </svg>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">
            <span className="txt-green">eco</span>
            <span className="txt-blue">tech</span>
          </span>
          <span className="sidebar-logo-sub">SOLUTIONS</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          >
            <Icon width={19} height={19} />
            <span>{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="sidebar-badge" aria-label={`${badge} ativos`}>
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      {footer && <div className="sidebar-footer">{footer}</div>}
    </aside>
  );
}
