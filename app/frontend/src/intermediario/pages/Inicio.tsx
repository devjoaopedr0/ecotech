import { Link } from 'react-router-dom';
import Card from '../../compartilhado/components/Card';
import Header from '../../compartilhado/components/Header';
import { BellIcon, ClockIcon, DropletIcon, HomeIcon, LeafIcon } from '../../compartilhado/components/icons';
import { ROTAS_INTER } from '../../routes/paths';
import { AcoesRapidas, AtividadesRecentes, CentralAtencao, GraficoPrincipal, IrrigacaoResumo, MonitoramentoPlantas, RecomendacoesLista, ResumoInteligente, StatusDados } from '../components';
import { useIntermediario } from '../useIntermediario';

const LIMITE_CENTRAL = 4;
const LIMITE_RECOMENDACOES = 3;
const LIMITE_PLANTAS = 6;

/**
 * Início da intermediária: acompanhamento diário da horta, em ordem de uso.
 *  1. Atualização dos dados e resumo (plantas monitoradas, umidade, sensores, irrigação)
 *  2. Ações rápidas
 *  3. Central de atenção e recomendações
 *  4. Plantas (semáforo, busca e filtros)
 *  5. Gráfico principal (um só, com planta e período)
 *  6. Irrigação e atividades recentes
 * Análises, comparações, múltiplos gráficos, histórico completo e configurações ficam na avançada.
 */
export default function Inicio({ openMenu }: { openMenu?: () => void }) {
  const { central, recomendacoes, atividades } = useIntermediario();

  return (
    <>
      <Header icon={<HomeIcon width={21} height={21} />} title="Início" subtitle="Como está a sua horta hoje" onOpenMenu={openMenu} />
      <div className="page-body">
        <StatusDados />
        <ResumoInteligente />
        <AcoesRapidas />

        <div className="inter-duo">
          <Card title="Central de atenção" icon={<BellIcon width={18} height={18} />} action={<Link className="link-btn" to={ROTAS_INTER.alertas}>Ver todas</Link>}>
            <CentralAtencao itens={central} limite={LIMITE_CENTRAL} />
          </Card>
          <Card title="Recomendações" icon={<LeafIcon width={18} height={18} />}>
            <RecomendacoesLista itens={recomendacoes} limite={LIMITE_RECOMENDACOES} />
          </Card>
        </div>

        <Card title="Minhas plantas" icon={<LeafIcon width={18} height={18} />} action={<Link className="link-btn" to={ROTAS_INTER.plantas}>Ver todas</Link>}>
          <MonitoramentoPlantas limite={LIMITE_PLANTAS} />
        </Card>

        <Card title="Evolução da umidade do solo" icon={<DropletIcon width={18} height={18} />}>
          <GraficoPrincipal />
        </Card>

        <div className="inter-duo">
          <Card title="Irrigação" icon={<DropletIcon width={18} height={18} />}>
            <IrrigacaoResumo />
          </Card>
          <Card title="Atividades recentes" icon={<ClockIcon width={18} height={18} />}>
            <AtividadesRecentes itens={atividades} />
          </Card>
        </div>
      </div>
    </>
  );
}
