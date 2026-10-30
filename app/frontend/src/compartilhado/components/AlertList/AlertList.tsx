import type { ReactNode } from 'react';
import type { PlantStatus } from '../../types';
import StatusBadge from '../StatusBadge';
import './AlertList.css';

const ROTULO: Record<PlantStatus, string> = {
  critico: 'Crítico',
  abaixo: 'Abaixo',
  atencao: 'Atenção',
  ideal: 'Info',
};

/** Item de alerta ou recomendação, exibido do mesmo jeito nas duas dashboards. */
export interface ItemAlerta {
  id: string;
  severidade: PlantStatus;
  titulo: string;
  mensagem: string;
  /** Texto do selo; por padrão vem da gravidade. */
  rotulo?: string;
  /** Linha complementar discreta (ex.: horário e planta relacionada). */
  meta?: ReactNode;
}

export default function AlertList({ alertas, limite }: { alertas: ItemAlerta[]; limite?: number }) {
  const itens = limite ? alertas.slice(0, limite) : alertas;
  return (
    <ul className="alert-list">
      {itens.map((a) => (
        <li key={a.id} className="alert-item">
          <StatusBadge status={a.severidade} label={a.rotulo ?? ROTULO[a.severidade]} />
          <span>
            <strong>{a.titulo}</strong> — {a.mensagem}
            {a.meta && <small className="alert-item-meta">{a.meta}</small>}
          </span>
        </li>
      ))}
    </ul>
  );
}
