import type { ComponentType } from 'react';
import VisaoGeral from '../pages/VisaoGeral';
import Dashboard from '../pages/Dashboard';
import Monitor from '../pages/Monitor';
import Plantas from '../pages/Plantas';
import Sensores from '../pages/Sensores';
import Relatorios from '../pages/Relatorios';
import Configuracoes from '../pages/Configuracoes';
import { ROTAS } from './paths';

export interface PaginaProps {
  openMenu?: () => void;
}

export interface RotaPrivada {
  path: string;
  pagina: ComponentType<PaginaProps>;
}

/** Telas autenticadas (com Sidebar/Header). Para criar uma tela nova: adicione o caminho em paths.ts e uma linha aqui. */
export const ROTAS_PRIVADAS: RotaPrivada[] = [
  { path: ROTAS.visaoGeral, pagina: VisaoGeral },
  { path: ROTAS.dashboard, pagina: Dashboard },
  { path: ROTAS.monitor, pagina: Monitor },
  { path: ROTAS.plantas, pagina: Plantas },
  { path: ROTAS.sensores, pagina: Sensores },
  { path: ROTAS.relatorios, pagina: Relatorios },
  { path: ROTAS.configuracoes, pagina: Configuracoes },
];
