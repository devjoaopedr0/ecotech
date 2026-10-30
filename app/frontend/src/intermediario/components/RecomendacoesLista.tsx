import { Link } from 'react-router-dom';
import AlertList, { type ItemAlerta } from '../../compartilhado/components/AlertList';
import EmptyState from '../../compartilhado/components/EmptyState';
import { HealthyIcon } from '../../compartilhado/components/icons';
import { ROTAS_INTER } from '../../routes/paths';
import type { Recomendacao } from '../regras/recomendacoes';

const destino = (r: Recomendacao) => (r.destino === 'irrigacao' ? ROTAS_INTER.irrigacao : r.plantaId ? ROTAS_INTER.planta(r.plantaId) : ROTAS_INTER.plantas);
const textoLink = (r: Recomendacao) => (r.destino === 'irrigacao' ? 'Abrir irrigação' : 'Ver planta');

function itemDaRecomendacao(r: Recomendacao): ItemAlerta {
  return {
    id: r.id,
    severidade: r.severidade,
    rotulo: 'Recomendação',
    titulo: r.titulo,
    mensagem: r.porQue,
    meta: (
      <>
        <span className="meta-line meta-action"><strong>O que fazer:</strong> {r.acao}</span>
        <span className="meta-line">{r.dispositivo && <>Dispositivo: {r.dispositivo} · </>}<Link to={destino(r)}>{textoLink(r)}</Link></span>
      </>
    ),
  };
}

export default function RecomendacoesLista({ itens, limite }: { itens: Recomendacao[]; limite?: number }) {
  if (itens.length === 0) {
    return <EmptyState icone={<HealthyIcon width={30} height={30} />} titulo="Sem recomendações no momento" texto="Nenhuma condição medida pede uma ação adicional." />;
  }
  return (
    <>
      <AlertList alertas={itens.map(itemDaRecomendacao)} limite={limite} />
      {limite !== undefined && itens.length > limite && <small className="api-hint">+ {itens.length - limite} recomendações. Consulte cada planta para ver todas.</small>}
    </>
  );
}
