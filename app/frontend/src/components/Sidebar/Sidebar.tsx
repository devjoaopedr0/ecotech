import { NavLink } from 'react-router-dom';
import { HomeIcon, DashboardIcon, DropletIcon, LeafIcon, GearIcon } from '../icons';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/', label: 'Visão Geral', icon: HomeIcon, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/monitor', label: 'Monitor', icon: DropletIcon },
  { to: '/plantas', label: 'Plantas', icon: LeafIcon },
  { to: '/configuracoes', label: 'Configurações', icon: GearIcon },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
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
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          >
            <Icon width={19} height={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
