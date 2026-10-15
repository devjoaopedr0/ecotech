import { useState, type ReactNode } from 'react';
import Sidebar from '../components/Sidebar';
import './MainLayout.css';

interface MainLayoutProps {
  children: ReactNode | ((openMenu: () => void) => ReactNode);
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="main-layout">
      <div className="bg-glow" aria-hidden="true" />
      <div className={`sidebar-shell ${mobileOpen ? 'sidebar-shell-open' : ''}`}>
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>
      {mobileOpen && <div className="sidebar-scrim" onClick={() => setMobileOpen(false)} />}
      <div className="main-content">
        {typeof children === 'function' ? children(() => setMobileOpen(true)) : children}
      </div>
    </div>
  );
}
