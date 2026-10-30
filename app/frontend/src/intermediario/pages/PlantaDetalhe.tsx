import { Link, useParams } from 'react-router-dom';
import Card from '../../compartilhado/components/Card';
import EmptyState from '../../compartilhado/components/EmptyState';
import Header from '../../compartilhado/components/Header';
import { ChevronLeftIcon, DropletIcon, LeafIcon, ThermometerIcon, WifiIcon } from '../../compartilhado/components/icons';
import { formatarDataHora, formatarRelativo } from '../../compartilhado/utils/format';
import { avaliarSensor, ROTULO_SITUACAO_LEITURA } from '../../compartilhado/utils/sensores';
import { validarLimites } from '../../compartilhado/utils/umidade';
import { ROTAS_INTER } from '../../routes/paths';
import { CentralAtencao, ControleIrrigacao, FaixaUmidade, GraficoPrincipal, RecomendacoesLista, SemaforoBadge } from '../components';
import { semaforoDaPlanta } from '../regras/semaforo';
import { useIntermediario } from '../useIntermediario';

/**
 * Detalhe de uma planta: estado ambiental, limites de umidade configurados (somente consulta), gráfico, irrigação
 * e o que merece atenção nesta planta. A edição de limites depende de persistência no backend e não é oferecida aqui.
 */
export default function PlantaDetalhe({ openMenu }: { openMenu?: () => void }) {
  const { plantaId = '' } = useParams();
  const { monitoradas, central, recomendacoes, leituras, culturas, agora, historicoIrrigacao } = useIntermediario();
  const m = monitoradas.find((x) => x.planta.id === plantaId);

  if (!m) {
    return (
      <>
        <Header icon={<LeafIcon width={21} height={21} />} title="Planta" subtitle="Detalhes" onOpenMenu={openMenu} />
        <div className="page-body">
          <Card>
            <EmptyState icone={<LeafIcon width={30} height={30} />} titulo="Planta não encontrada" texto="Ela pode ter sido removida." acao={{ para: ROTAS_INTER.plantas, rotulo: 'Voltar para as plantas' }} />
          </Card>
        </div>
      </>
    );
  }

  const { planta, sensor } = m;
  const s = semaforoDaPlanta(m);
  const semLeitura = m.estado === 'sem_dados';
  const erroLimites = validarLimites(planta);
  const cultura = culturas[planta.culturaId];
  const leituraSensor = sensor ? avaliarSensor(sensor, leituras, agora) : null;
  const ocorrencias = central.filter((i) => i.planta?.id === planta.id);
  const dicas = recomendacoes.filter((r) => r.plantaId === planta.id);
  const irrigacoes = historicoIrrigacao.filter((r) => r.plantaId === planta.id).slice(0, 3);

  return (
    <>
      <Header icon={<LeafIcon width={21} height={21} />} title={`${planta.emoji} ${planta.nome}`} subtitle={`${planta.canteiro} · ${planta.tipo}`} onOpenMenu={openMenu} />
      <div className="page-body">
        <Link className="link-btn inter-voltar" to={ROTAS_INTER.plantas}><ChevronLeftIcon width={14} height={14} /> Todas as plantas</Link>

        <div className="inter-duo">
          <Card title="Estado atual" icon={<DropletIcon width={18} height={18} />}>
            <div className="inter-detalhe-topo">
              <strong className="inter-detalhe-valor">{semLeitura ? '—' : `${planta.umidadeAtual}%`}</strong>
              <SemaforoBadge nivel={s.nivel} rotulo={s.rotulo} />
            </div>
            <ul className="inter-motivos">{s.motivos.map((t) => <li key={t}>{t}</li>)}</ul>
            <div className="info-row"><span><WifiIcon width={15} height={15} /> Sensor</span><strong>{sensor ? `${sensor.nome} · ${leituraSensor ? ROTULO_SITUACAO_LEITURA[leituraSensor.situacao] : ''}` : 'Sem sensor de umidade'}</strong></div>
            <div className="info-row"><span>Última atualização</span><strong>{m.ultimaLeituraMs ? `${formatarRelativo(m.ultimaLeituraMs, agora)} (${formatarDataHora(m.ultimaLeituraMs)})` : 'Sem leitura registrada'}</strong></div>
            <div className="info-row"><span><ThermometerIcon width={15} height={15} /> Temperatura</span><strong>{planta.temperatura.toFixed(1).replace('.', ',')} °C{cultura ? ` (faixa da cultura: ${cultura.temperaturaMin}–${cultura.temperaturaMax} °C)` : ''}</strong></div>
            <div className="info-row"><span>Recomendação</span><strong>{m.recomendacao}</strong></div>
          </Card>

          <Card title="Limites de umidade" icon={<DropletIcon width={18} height={18} />}>
            {erroLimites ? (
              <EmptyState titulo="Limites não configurados corretamente" texto={`${erroLimites} Ajuste os limites desta planta na dashboard avançada.`} />
            ) : (
              <>
                <FaixaUmidade planta={planta} atual={semLeitura ? null : planta.umidadeAtual} />
                <ul className="inter-limites">
                  <li><SemaforoBadge nivel="critico" rotulo={`Crítico: abaixo de ${planta.umidadeCritica}%`} /></li>
                  <li><SemaforoBadge nivel="atencao" rotulo={`Atenção: abaixo de ${planta.umidadeMinima}% ou acima de ${planta.umidadeMaxima}%`} /></li>
                  <li><SemaforoBadge nivel="adequado" rotulo={`Ideal: ${planta.faixaMin}–${planta.faixaMax}%`} /></li>
                </ul>
                <small className="api-hint">Limites cadastrados para esta planta, somente para consulta. A edição depende de persistência no backend.</small>
              </>
            )}
          </Card>
        </div>

        <Card title="Evolução da umidade" icon={<DropletIcon width={18} height={18} />}>
          <GraficoPrincipal plantaFixaId={planta.id} />
        </Card>

        <div className="inter-duo">
          <Card title="Irrigação" icon={<DropletIcon width={18} height={18} />}>
            <ControleIrrigacao plantaId={planta.id} />
            {irrigacoes.length > 0 && (
              <ul className="inter-atividades inter-atividades-compacta">
                {irrigacoes.map((r) => <li key={r.id}><span><strong>{formatarDataHora(r.timestamp)}</strong><small>{r.duracaoMin} min · umidade de {r.umidadeAntes}% para {r.umidadeDepois}%</small></span></li>)}
              </ul>
            )}
          </Card>
          <Card title="Atenção para esta planta" icon={<LeafIcon width={18} height={18} />}>
            {ocorrencias.length === 0 && dicas.length === 0 ? (
              <CentralAtencao itens={[]} />
            ) : (
              <div className="stack-col">
                {ocorrencias.length > 0 && <CentralAtencao itens={ocorrencias} />}
                {dicas.length > 0 && <RecomendacoesLista itens={dicas} />}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
