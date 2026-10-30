import Sidebar, { type NavItem } from '../compartilhado/components/Sidebar';
import { GearIcon, HomeIcon, LeafIcon } from '../compartilhado/components/icons';
import { ROTAS_BASICO } from '../routes/paths';
import { useBasico } from './useBasico';

/** Menu da básica: só início (com o número de coisas a fazer), plantas e configurações. */
export default function SidebarBasico({ onNavigate }: { onNavigate?: () => void }) {
  const { tarefas } = useBasico();
  const itens: NavItem[] = [
    { to: ROTAS_BASICO.inicio, label: 'Início', icon: HomeIcon, end: true, badge: tarefas.length },
    { to: ROTAS_BASICO.plantas, label: 'Minhas plantas', icon: LeafIcon },
    { to: ROTAS_BASICO.configuracoes, label: 'Configurações', icon: GearIcon },
  ];
  return <Sidebar items={itens} onNavigate={onNavigate} />;
}
