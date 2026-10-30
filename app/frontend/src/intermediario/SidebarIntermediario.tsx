import Sidebar, { type NavItem } from '../compartilhado/components/Sidebar';
import { BellIcon, DropletIcon, GearIcon, HomeIcon, LeafIcon } from '../compartilhado/components/icons';
import { useIntermediario } from './useIntermediario';
import { ROTAS_INTER } from '../routes/paths';

/** Menu da intermediária: o componente Sidebar da avançada, só com o essencial do dia a dia (início, plantas, irrigação, alertas e configurações). */
export default function SidebarIntermediario({ onNavigate }: { onNavigate?: () => void }) {
  const { central } = useIntermediario();
  const itens: NavItem[] = [
    { to: ROTAS_INTER.inicio, label: 'Início', icon: HomeIcon, end: true },
    { to: ROTAS_INTER.plantas, label: 'Plantas', icon: LeafIcon },
    { to: ROTAS_INTER.irrigacao, label: 'Irrigação', icon: DropletIcon },
    { to: ROTAS_INTER.alertas, label: 'Alertas', icon: BellIcon, badge: central.length },
    { to: ROTAS_INTER.configuracoes, label: 'Configurações', icon: GearIcon },
  ];
  return <Sidebar items={itens} onNavigate={onNavigate} />;
}
