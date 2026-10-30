import { useSearchParams } from 'react-router-dom';
import Card from '../../compartilhado/components/Card';
import Header from '../../compartilhado/components/Header';
import { LeafIcon } from '../../compartilhado/components/icons';
import { MonitoramentoPlantas } from '../components';
import { ehFiltro } from '../regras/plantas';

/**
 * Plantas da intermediária: todas as plantas com semáforo, busca e filtros simples (as mais urgentes primeiro).
 * O filtro inicial pode vir do endereço (?filtro=atencao | alertas | sem_dados), usado pelas ações rápidas.
 */
export default function MinhasPlantas({ openMenu }: { openMenu?: () => void }) {
  const [params] = useSearchParams();
  const filtro = params.get('filtro');

  return (
    <>
      <Header icon={<LeafIcon width={21} height={21} />} title="Plantas" subtitle="Como está cada planta" onOpenMenu={openMenu} />
      <div className="page-body">
        <Card>
          {/* key: ao trocar o filtro pelo endereço (atalhos), o componente reinicia com o novo filtro inicial */}
          <MonitoramentoPlantas key={filtro ?? 'todas'} filtroInicial={ehFiltro(filtro) ? filtro : 'todas'} />
        </Card>
      </div>
    </>
  );
}
