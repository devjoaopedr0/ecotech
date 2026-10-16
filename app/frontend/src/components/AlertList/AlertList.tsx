import type { PlantStatus } from '../../types';
import StatusBadge from '../StatusBadge';

const ROTULO: Record<PlantStatus, string> = {
  critico: 'Crítico',
  abaixo: 'Abaixo',
  atencao: 'Atenção',
  ideal: 'Info',
};

/** Lista de alertas usando as classes `alert-list` / `alert-item` já existentes (VisaoGeral.css). */
export interface ItemAlerta {
  id: string;
  severidade: PlantStatus;
  titulo: string;
  mensagem: string;
  /** Texto do selo; por padrão vem da gravidade. */
  rotulo?: string;
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
          </span>
        </li>
      ))}
    </ul>
  );
}
