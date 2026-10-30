import { Link } from 'react-router-dom';
import Card from '../../compartilhado/components/Card';
import Header from '../../compartilhado/components/Header';
import { BellIcon, HomeIcon, LeafIcon } from '../../compartilhado/components/icons';
import { ROTAS_BASICO } from '../../routes/paths';
import { ListaPlantas, ListaTarefas, SituacaoHorta } from '../components';
import { useBasico } from '../useBasico';

const LIMITE_PLANTAS = 4;

/**
 * Início da básica, em ordem de leitura:
 *  1. Como está a horta (uma frase)
 *  2. O que fazer agora
 *  3. As plantas que mais precisam de cuidado, com o botão de regar
 * Gráficos, históricos, sensores e números técnicos ficam nas outras dashboards.
 */
export default function Inicio({ openMenu }: { openMenu?: () => void }) {
  const { tarefas, monitoradas } = useBasico();

  return (
    <>
      <Header icon={<HomeIcon width={21} height={21} />} title="Início" subtitle="Como está a sua horta" onOpenMenu={openMenu} />
      <div className="page-body basico">
        <SituacaoHorta />

        <Card title="O que fazer agora" icon={<BellIcon width={20} height={20} />}>
          <ListaTarefas tarefas={tarefas} />
        </Card>

        <Card
          title="Minhas plantas"
          icon={<LeafIcon width={20} height={20} />}
          action={monitoradas.length > LIMITE_PLANTAS && <Link className="link-btn" to={ROTAS_BASICO.plantas}>Ver todas</Link>}
        >
          <ListaPlantas limite={LIMITE_PLANTAS} />
        </Card>
      </div>
    </>
  );
}
