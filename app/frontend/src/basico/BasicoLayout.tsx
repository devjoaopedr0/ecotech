import type { ReactNode } from 'react';
import MainLayout from '../compartilhado/layouts/MainLayout';
import SidebarBasico from './SidebarBasico';
import './basico.css';

/**
 * Shell da dashboard básica: o MESMO layout das outras (menu lateral, cabeçalho, tema, responsividade).
 * O que muda é o conteúdo: menu mínimo, textos simples e botões grandes.
 */
export default function BasicoLayout({ children }: { children: ReactNode | ((openMenu: () => void) => ReactNode) }) {
  return <MainLayout renderSidebar={(fecharMenu) => <SidebarBasico onNavigate={fecharMenu} />}>{children}</MainLayout>;
}
