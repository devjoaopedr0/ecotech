import { Link } from 'react-router-dom';
import EmptyState from '../../compartilhado/components/EmptyState';
import { ClockIcon, DropletIcon, LeafIcon } from '../../compartilhado/components/icons';
import { formatarDataHora } from '../../compartilhado/utils/format';
import { ROTAS_INTER } from '../../routes/paths';
import type { Atividade } from '../regras/atividades';

/** Últimas atividades com horário (irrigações e mudanças de estado da umidade). Quantidade limitada; não é o histórico completo. */
export default function AtividadesRecentes({ itens, limite = 6 }: { itens: Atividade[]; limite?: number }) {
  if (itens.length === 0) {
    return <EmptyState icone={<ClockIcon width={30} height={30} />} titulo="Nenhuma atividade registrada" texto="As irrigações e mudanças de estado da umidade aparecerão aqui." />;
  }
  return (
    <ul className="inter-atividades">
      {itens.slice(0, limite).map((a) => (
        <li key={a.id}>
          <span className="inter-atividade-icone" aria-hidden="true">{a.tipo === 'umidade' ? <LeafIcon width={16} height={16} /> : <DropletIcon width={16} height={16} />}</span>
          <span>
            <strong>{a.titulo}</strong>
            <small>{a.detalhe}</small>
            <small>
              {formatarDataHora(a.ts)}
              {a.plantaId && <> · <Link to={ROTAS_INTER.planta(a.plantaId)}>Ver planta</Link></>}
            </small>
          </span>
        </li>
      ))}
    </ul>
  );
}
