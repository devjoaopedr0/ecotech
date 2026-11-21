import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ROTAS } from '../../../routes/paths';
import { useNavigate } from 'react-router-dom';
import { FONTE_DADOS } from '../../utils/fonteDados';
import { AlertOctagonIcon, BellIcon, InfoIcon, MenuIcon, UserCircleIcon, LogoutIcon, GearIcon, WarningIcon } from '../icons';
import { useAuth } from '../../context/AuthContext';
import { usePlants } from '../../context/PlantsContext';
import { ROTA_CONFIGURACOES } from '../../utils/nivel';
import './Header.css';

interface HeaderProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  onOpenMenu?: () => void;
}

export default function Header({ title, subtitle, icon, onOpenMenu }: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const { usuario, logout, nivel } = useAuth();
  const { alertas } = usePlants();
  const navigate = useNavigate();
  // O menu do usuário leva às Configurações dentro da dashboard do nível dele.
  const caminhoConfig = ROTA_CONFIGURACOES[nivel];

  // Sombra no cabeçalho fixo só depois de rolar a página.
  const [rolado, setRolado] = useState(false);
  useEffect(() => {
    const onScroll = () => setRolado(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setUserOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className={`page-header ${rolado ? 'page-header-rolado' : ''}`}>
      {onOpenMenu && (
        <button className="mobile-menu-btn hide-desktop" onClick={onOpenMenu} aria-label="Abrir menu">
          <MenuIcon width={22} height={22} />
        </button>
      )}
      <div className="page-header-icon" aria-hidden="true">{icon}</div>
      <div className="page-header-text">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="page-header-right">
        <span className="status-pill" title={FONTE_DADOS.descricao}>
          <span className={`status-dot ${FONTE_DADOS.tipo === 'simulado' ? 'status-dot-sim' : ''}`} aria-hidden="true" />
          <span className="status-pill-text">{FONTE_DADOS.rotulo}</span>
        </span>

        <div className="header-popover" ref={notifRef}>
          <button className="header-icon-btn" onClick={() => setNotifOpen((v) => !v)} aria-label={alertas.length > 0 ? `Notificações (${alertas.length})` : 'Notificações'} aria-expanded={notifOpen}>
            <BellIcon width={19} height={19} />
            {alertas.length > 0 && <span className="header-icon-dot" />}
          </button>
          {notifOpen && (
            <div className="popover-panel popover-notif" role="dialog" aria-label="Notificações">
              <div className="popover-title">
                Notificações {alertas.length > 0 && <span className="popover-contagem">{alertas.length}</span>}
              </div>
              {alertas.length === 0 && <div className="popover-item">Nenhuma notificação no momento.</div>}
              {alertas.slice(0, 6).map((n) => {
                const Icone = n.severidade === 'critico' ? AlertOctagonIcon : n.severidade === 'ideal' ? InfoIcon : WarningIcon;
                return (
                  <div key={n.id} className={`popover-item popover-item-${n.severidade}`}>
                    <Icone width={15} height={15} aria-hidden="true" />
                    <span>
                      <strong>{n.titulo}</strong>
                      {n.mensagem}
                    </span>
                  </div>
                );
              })}
              {alertas.length > 6 && <div className="popover-rodape">+ {alertas.length - 6} notificações</div>}
            </div>
          )}
        </div>

        <div className="header-popover" ref={userRef}>
          <button className="header-avatar-btn" onClick={() => setUserOpen((v) => !v)} aria-label="Menu do usuário" aria-expanded={userOpen}>
            <UserCircleIcon width={26} height={26} />
          </button>
          {userOpen && (
            <div className="popover-panel popover-panel-right">
              <div className="popover-title">{usuario || 'Usuário'}</div>
              <button
                className="popover-action"
                onClick={() => {
                  setUserOpen(false);
                  navigate(caminhoConfig);
                }}
              >
                <GearIcon width={16} height={16} />
                Configurações
              </button>
              <button
                className="popover-action popover-action-danger"
                onClick={() => {
                  logout();
                  navigate(ROTAS.login);
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
