import Card from '../../compartilhado/components/Card';
import Header from '../../compartilhado/components/Header';
import { BellIcon, LeafIcon } from '../../compartilhado/components/icons';
import { CentralAtencao, RecomendacoesLista } from '../components';
import { useIntermediario } from '../useIntermediario';

/** Alertas da intermediária: toda a Central de atenção (por prioridade) e as recomendações, sempre com a ação a tomar. */
export default function Alertas({ openMenu }: { openMenu?: () => void }) {
  const { central, recomendacoes } = useIntermediario();

  return (
    <>
      <Header icon={<BellIcon width={21} height={21} />} title="Alertas" subtitle="O que precisa de atenção" onOpenMenu={openMenu} />
      <div className="page-body">
        <Card title="Central de atenção" icon={<BellIcon width={18} height={18} />}>
          <CentralAtencao itens={central} />
        </Card>
        {recomendacoes.length > 0 && (
          <Card title="Recomendações" icon={<LeafIcon width={18} height={18} />}>
            <RecomendacoesLista itens={recomendacoes} />
          </Card>
        )}
      </div>
    </>
  );
}
