import type { ComponentType } from 'react';
import VisaoGeral from '../avancado/pages/VisaoGeral';
import Dashboard from '../avancado/pages/Dashboard';
import Monitor from '../avancado/pages/Monitor';
import Plantas from '../avancado/pages/Plantas';
import Sensores from '../avancado/pages/Sensores';
import Relatorios from '../avancado/pages/Relatorios';
import Configuracoes from '../compartilhado/pages/Configuracoes';
import { Alertas, Inicio, Irrigacao, MinhasPlantas, PlantaDetalhe } from '../intermediario';
import { Inicio as InicioBasico, Plantas as PlantasBasico } from '../basico';
import { ROTAS, ROTAS_BASICO, ROTAS_INTER } from './paths';

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

/** Telas da dashboard intermediária (mesmas regras das privadas, mas com o layout/menu de /intermediario). */
export const ROTAS_INTERMEDIARIO: RotaPrivada[] = [
  { path: ROTAS_INTER.inicio, pagina: Inicio },
  { path: ROTAS_INTER.plantas, pagina: MinhasPlantas },
  { path: ROTAS_INTER.plantaDetalhe, pagina: PlantaDetalhe },
  { path: ROTAS_INTER.irrigacao, pagina: Irrigacao },
  { path: ROTAS_INTER.alertas, pagina: Alertas },
  // Reaproveita a tela existente de Configurações (tema, perfil, senha, notificações) dentro do layout intermediário.
  { path: ROTAS_INTER.configuracoes, pagina: Configuracoes },
];

/** Telas da dashboard básica (layout/menu de /basico). */
export const ROTAS_BASICAS: RotaPrivada[] = [
  { path: ROTAS_BASICO.inicio, pagina: InicioBasico },
  { path: ROTAS_BASICO.plantas, pagina: PlantasBasico },
  { path: ROTAS_BASICO.configuracoes, pagina: Configuracoes },
];
