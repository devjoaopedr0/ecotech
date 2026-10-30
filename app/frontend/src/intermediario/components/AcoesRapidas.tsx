import { Link } from 'react-router-dom';
import { BellIcon, DropletIcon, LeafIcon, WifiIcon } from '../../compartilhado/components/icons';
import { ROTAS_INTER } from '../../routes/paths';
import { useIntermediario } from '../useIntermediario';
import { precisaAtencao } from '../regras/semaforo';

/** Atalhos para telas e filtros que existem de fato; os números vêm dos mesmos dados das listas de destino. */
export default function AcoesRapidas() {
  const { monitoradas, central } = useIntermediario();
  const atencao = monitoradas.filter(precisaAtencao).length;
  const indisponiveis = monitoradas.filter((m) => m.estado === 'sem_dados').length;
  const itens = [
    { to: `${ROTAS_INTER.plantas}?filtro=atencao`, icone: <LeafIcon width={17} height={17} />, rotulo: 'Plantas que precisam de atenção', n: atencao },
    { to: ROTAS_INTER.alertas, icone: <BellIcon width={17} height={17} />, rotulo: 'Alertas ativos', n: central.length },
    { to: `${ROTAS_INTER.plantas}?filtro=sem_dados`, icone: <WifiIcon width={17} height={17} />, rotulo: 'Sensores indisponíveis', n: indisponiveis },
    { to: ROTAS_INTER.irrigacao, icone: <DropletIcon width={17} height={17} />, rotulo: 'Controle de irrigação' },
  ];
  return (
    <nav className="inter-atalhos" aria-label="Ações rápidas">
      {itens.map((i) => (
        <Link key={i.rotulo} to={i.to} className="inter-atalho">
          {i.icone}
          <span>{i.rotulo}</span>
          {i.n !== undefined && <strong>{i.n}</strong>}
        </Link>
      ))}
    </nav>
  );
}
