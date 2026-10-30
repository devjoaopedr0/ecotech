import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  titulo: string;
  texto?: string;
  icone?: ReactNode;
  acao?: { para: string; rotulo: string };
}

/** Estado vazio padrão (usa as classes `empty-state` de styles/common.css). */
export default function EmptyState({ titulo, texto, icone, acao }: Props) {
  return (
    <div className="empty-state" role="status">
      {icone}
      <strong>{titulo}</strong>
      {texto && <span>{texto}</span>}
      {acao && (
        <Link className="link-btn" to={acao.para}>
          {acao.rotulo}
        </Link>
      )}
    </div>
  );
}
