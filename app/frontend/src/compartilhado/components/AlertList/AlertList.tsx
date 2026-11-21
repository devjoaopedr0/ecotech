import type { ReactNode } from 'react';
import type { PlantStatus } from '../../types';
import StatusBadge, { type StatusVisual } from '../StatusBadge';
import './AlertList.css';

const ROTULO: Record<PlantStatus, string> = {
  critico: 'Crítico',
  abaixo: 'Abaixo',
  atencao: 'Atenção',
  ideal: 'Info',
};

/** Em alertas, "ideal" significa ocorrência informativa (não "planta normal"): usa o visual azul de informação. */
const VISUAL: Record<PlantStatus, StatusVisual> = { critico: 'critico', abaixo: 'abaixo', atencao: 'atencao', ideal: 'info' };

/** Item de alerta ou recomendação, exibido do mesmo jeito nas três dashboards (muda só a profundidade). */
export interface ItemAlerta {
  id: string;
  severidade: PlantStatus;
  /** O que aconteceu (curto). */
  titulo: string;
  /** Por que aconteceu / contexto. */
  mensagem: string;
  /** Texto do selo; por padrão vem da gravidade. */
  rotulo?: string;
  /** Linhas complementares (ex.: horário, planta, "O que fazer"). */
  meta?: ReactNode;
  /** Dados técnicos recolhíveis (indicador, valor, limite). Ficam fechados para não poluir a lista. */
  detalhes?: ReactNode;
}

export default function AlertList({ alertas, limite }: { alertas: ItemAlerta[]; limite?: number }) {
  const itens = limite ? alertas.slice(0, limite) : alertas;
  return (
    <ul className="alert-list">
      {itens.map((a) => (
        <li key={a.id} className={`alert-item alert-item-${VISUAL[a.severidade]}`}>
          <div className="alert-item-top">
            <StatusBadge status={VISUAL[a.severidade]} label={a.rotulo ?? ROTULO[a.severidade]} />
          </div>
          <strong className="alert-item-titulo">{a.titulo}</strong>
          <p className="alert-item-msg">{a.mensagem}</p>
          {a.meta && <div className="alert-item-meta">{a.meta}</div>}
          {a.detalhes && (
            <details className="alert-item-detalhes">
              <summary>Dados técnicos</summary>
              <div>{a.detalhes}</div>
            </details>
          )}
        </li>
      ))}
    </ul>
  );
}
