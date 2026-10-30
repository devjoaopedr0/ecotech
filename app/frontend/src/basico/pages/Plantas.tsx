import Header from '../../compartilhado/components/Header';
import { LeafIcon } from '../../compartilhado/components/icons';
import { ListaPlantas } from '../components';

/** Todas as plantas da básica, sem filtros nem busca: as que precisam de cuidado aparecem primeiro. */
export default function Plantas({ openMenu }: { openMenu?: () => void }) {
  return (
    <>
      <Header icon={<LeafIcon width={21} height={21} />} title="Minhas plantas" subtitle="Como está cada planta" onOpenMenu={openMenu} />
      <div className="page-body basico">
        <ListaPlantas />
      </div>
    </>
  );
}
