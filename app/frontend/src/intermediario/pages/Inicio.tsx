import { Link, useNavigate } from 'react-router-dom';
import Card from '../../compartilhado/components/Card';
import Header from '../../compartilhado/components/Header';
import MapaHorta from '../../compartilhado/components/MapaHorta';
import { BellIcon, ClockIcon, DropletIcon, HomeIcon, LeafIcon, MapIcon } from '../../compartilhado/components/icons';
import { ROTAS_INTER } from '../../routes/paths';
import { AcoesRapidas, AtividadesRecentes, CentralAtencao, GraficoPrincipal, IrrigacaoResumo, RecomendacoesLista, ResumoInteligente, StatusDados } from '../components';
import { useIntermediario } from '../useIntermediario';

const LIMITE_CENTRAL = 4;
const LIMITE_RECOMENDACOES = 3;

/**
 * Início da intermediária, organizado em camadas:
 *  1. Situação — atualização dos dados, Saúde da Horta (nota + indicadores) e atalhos
 *  2. Onde está o problema — mapa da horta (por canteiro) com o painel da planta
 *  3. Análise — evolução da umidade (um gráfico, com planta e período)
 *  4. Decisão — central de atenção, recomendações, irrigação e atividades recentes
 * A lista completa de plantas, com busca e filtros, fica em Plantas. Telemetria e dados brutos ficam na avançada.
 */
export default function Inicio({ openMenu }: { openMenu?: () => void }) {
  const { central, recomendacoes, atividades } = useIntermediario();
  const navigate = useNavigate();

  return (
    <>
      <Header icon={<HomeIcon width={21} height={21} />} title="Início" subtitle="Como está a sua horta hoje" onOpenMenu={openMenu} />
      <div className="page-body">
        <StatusDados />
        <ResumoInteligente />
        <AcoesRapidas />

        <div className="camada"><h2>Onde agir</h2><p>Toque em uma planta para ver os detalhes</p></div>
        <Card
          title="Mapa da horta"
          subtitle="Quais plantas precisam de atenção, canteiro por canteiro?"
          icon={<MapIcon width={18} height={18} />}
          action={<Link className="link-btn" to={ROTAS_INTER.plantas}>Lista com filtros</Link>}
        >
          <MapaHorta modo="simples" onAbrir={(id) => navigate(ROTAS_INTER.planta(id))} rotuloAbrir="Abrir planta" />
        </Card>

        <div className="inter-duo">
          <Card title="Central de atenção" subtitle="O que aconteceu e o que fazer" icon={<BellIcon width={18} height={18} />} action={<Link className="link-btn" to={ROTAS_INTER.alertas}>Ver todas</Link>}>
            <CentralAtencao itens={central} limite={LIMITE_CENTRAL} />
          </Card>
          <Card title="Recomendações" subtitle="Próximos passos sugeridos pelos dados" icon={<LeafIcon width={18} height={18} />}>
            <RecomendacoesLista itens={recomendacoes} limite={LIMITE_RECOMENDACOES} />
          </Card>
        </div>

        <div className="camada"><h2>Análise</h2><p>Tendência e histórico recente</p></div>
        <Card title="Evolução da umidade do solo" subtitle="Como a umidade mudou no período?" icon={<DropletIcon width={18} height={18} />}>
          <GraficoPrincipal />
        </Card>

        <div className="inter-duo">
          <Card title="Irrigação" subtitle="Quando a horta foi irrigada?" icon={<DropletIcon width={18} height={18} />}>
            <IrrigacaoResumo />
          </Card>
          <Card title="Atividades recentes" subtitle="Últimos eventos registrados" icon={<ClockIcon width={18} height={18} />}>
            <AtividadesRecentes itens={atividades} />
          </Card>
        </div>
      </div>
    </>
  );
}
