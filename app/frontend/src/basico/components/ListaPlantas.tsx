import EmptyState from '../../compartilhado/components/EmptyState';
import { LeafIcon } from '../../compartilhado/components/icons';
import { useBasico } from '../useBasico';
import CartaoPlanta from './CartaoPlanta';

/** Plantas em cartões grandes, as que precisam de cuidado primeiro. */
export default function ListaPlantas({ limite }: { limite?: number }) {
  const { monitoradas } = useBasico();
  if (monitoradas.length === 0) {
    return <EmptyState icone={<LeafIcon width={30} height={30} />} titulo="Nenhuma planta cadastrada" texto="Peça ajuda para cadastrar as plantas da sua horta." />;
  }
  const visiveis = limite ? monitoradas.slice(0, limite) : monitoradas;
  return (
    <ul className="basico-plantas">
      {visiveis.map((m) => (
        <li key={m.planta.id}>
          <CartaoPlanta monitorada={m} />
        </li>
      ))}
    </ul>
  );
}
