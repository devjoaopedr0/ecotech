import type { ReactNode } from 'react';
import MainLayout from '../compartilhado/layouts/MainLayout';
import SidebarIntermediario from './SidebarIntermediario';
import './intermediario.css';

/**
 * Shell da dashboard intermediária: o MESMO layout da avançada (menu lateral, cabeçalho, tema, responsividade).
 * O que muda é o conteúdo: menu com menos itens e telas mais simples.
 */
export default function IntermediarioLayout({ children }: { children: ReactNode | ((openMenu: () => void) => ReactNode) }) {
  return <MainLayout renderSidebar={(fecharMenu) => <SidebarIntermediario onNavigate={fecharMenu} />}>{children}</MainLayout>;
}
