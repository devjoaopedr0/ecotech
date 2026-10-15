import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, UserCircleIcon, LogoutIcon, GearIcon } from '../icons';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

interface HeaderProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  onOpenMenu?: () => void;
}

const NOTIFICACOES = [
  { id: 1, texto: 'Sálvia está com umidade abaixo do ideal (39%).' },
  { id: 2, texto: 'Manjericão precisa de atenção (48%).' },
  { id: 3, texto: 'Irrigação da Alface concluída às 07:42.' },
];

export default function Header({ title, subtitle, icon, onOpenMenu }: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="page-header">
      <button className="mobile-menu-btn hide-desktop" onClick={onOpenMenu} aria-label="Abrir menu">
        ☰
      </button>
      <div className="page-header-icon">{icon}</div>
      <div className="page-header-text">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="page-header-right">
        <span className="status-pill hide-mobile">
          <span className="status-dot" />
          Sistema conectado
        </span>

        <div className="header-popover" ref={notifRef}>
          <button className="header-icon-btn" onClick={() => setNotifOpen((v) => !v)} aria-label="Notificações">
            <BellIcon width={19} height={19} />
            <span className="header-icon-dot" />
          </button>
          {notifOpen && (
            <div className="popover-panel">
              <div className="popover-title">Notificações</div>
              {NOTIFICACOES.map((n) => (
                <div key={n.id} className="popover-item">
                  {n.texto}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="header-popover" ref={userRef}>
          <button className="header-avatar-btn" onClick={() => setUserOpen((v) => !v)} aria-label="Menu do usuário">
            <UserCircleIcon width={26} height={26} />
          </button>
          {userOpen && (
            <div className="popover-panel popover-panel-right">
              <div className="popover-title">{usuario || 'Usuário'}</div>
              <button
                className="popover-action"
                onClick={() => {
                  setUserOpen(false);
                  navigate('/configuracoes');
                }}
              >
                <GearIcon width={16} height={16} />
                Configurações
              </button>
              <button
                className="popover-action popover-action-danger"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <LogoutIcon width={16} height={16} />
                Sair do sistema
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
