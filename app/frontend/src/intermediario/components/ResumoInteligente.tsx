import Card from '../../compartilhado/components/Card';
import { DropletIcon, HealthyIcon, LeafIcon, WarningIcon, WifiIcon } from '../../compartilhado/components/icons';
import { formatarRelativo } from '../../compartilhado/utils/format';
import { situacaoDaHorta, type SituacaoHorta } from '../../compartilhado/utils/horta';
import { avaliarAtualizacao } from '../regras/atualizacao';
import { useIntermediario } from '../useIntermediario';

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/**
 * Resumo da horta na intermediária. Os números vêm de useHorta (mesma fonte e regras da avançada) e diferenciam
 * plantas cadastradas de plantas efetivamente monitoradas (com leitura confiável).
 * Se os dados estão desatualizados, a situação não é afirmada: o texto avisa que pode não refletir o momento atual.
 */
export default function ResumoInteligente() {
  const { indicadores: ind, semaforo, central, plantas, leituras, agora, algumaIrrigando, irrigacoesAtivas } = useIntermediario();
  const precisam = semaforo.atencao + semaforo.critico;
  const dados = avaliarAtualizacao(plantas, leituras, agora);

  const base = situacaoDaHorta(ind);
  const situacao: SituacaoHorta = dados.desatualizado && ind.totalPlantas > 0
    ? { nivel: 'atencao', titulo: 'Situação não confirmada', texto: 'Os dados estão desatualizados: a situação abaixo pode não refletir o momento atual.' }
    : { ...base, texto: central.length > 0 ? `${base.texto} ${plural(central.length, 'ocorrência exige atenção', 'ocorrências exigem atenção')}.` : base.texto };

  return (
    <section className="vg-top-row" aria-label="Resumo da horta">
      <Card accent={situacao.nivel === 'ok' ? 'success' : 'default'} className="vg-health-card">
        <div className={`vg-health-icon ${situacao.nivel !== 'ok' ? `vg-health-icon-${situacao.nivel}` : ''}`}>
          {situacao.nivel === 'ok' ? <HealthyIcon width={26} height={26} /> : <WarningIcon width={26} height={26} />}
        </div>
        <div>
          <h2>{situacao.titulo}</h2>
          <p>{situacao.texto}</p>
        </div>
      </Card>

      <Card className="vg-mini-card">
        <span className="vg-mini-label"><LeafIcon width={16} height={16} /> Plantas monitoradas</span>
        <strong>{ind.plantasComLeitura} de {ind.totalPlantas}</strong>
        <span className="vg-mini-sub">
          {precisam > 0 ? `${plural(precisam, 'precisa de atenção', 'precisam de atenção')}` : 'nenhuma precisa de atenção'}
          {ind.semDados > 0 ? ` · ${ind.semDados} sem leitura` : ''}
        </span>
      </Card>

      <Card className="vg-mini-card">
        <span className="vg-mini-label"><DropletIcon width={16} height={16} /> Umidade média</span>
        <strong>{ind.umidadeMedia === null ? '—' : `${ind.umidadeMedia}%`}</strong>
        <span className="vg-mini-sub">
          {ind.ultimaLeituraMs ? `Última leitura: ${formatarRelativo(ind.ultimaLeituraMs, agora)}` : 'Sem leitura confiável disponível'}
        </span>
      </Card>

      <Card className="vg-mini-card">
        <span className="vg-mini-label"><WifiIcon width={16} height={16} /> Sensores</span>
        <strong className={ind.dispositivos.offline === 0 ? 'txt-ok' : ''}>{ind.dispositivos.total === 0 ? '—' : ind.dispositivos.offline === 0 ? 'Online' : `${ind.dispositivos.offline} offline`}</strong>
        <span className="vg-mini-sub">
          <span className={`dot ${ind.dispositivos.offline === 0 && ind.dispositivos.total > 0 ? 'dot-on' : 'dot-off'}`} />
          {ind.dispositivos.online} de {ind.dispositivos.total} conectados
        </span>
      </Card>

      <Card className="vg-mini-card">
        <span className="vg-mini-label"><DropletIcon width={16} height={16} /> Irrigação</span>
        <strong className={algumaIrrigando ? 'txt-ok' : ''}>{algumaIrrigando ? 'Em andamento' : 'Em espera'}</strong>
        <span className="vg-mini-sub">
          <span className={`dot ${algumaIrrigando ? 'dot-on' : 'dot-off'}`} />
          {algumaIrrigando ? plural(irrigacoesAtivas, 'planta sendo irrigada', 'plantas sendo irrigadas') : 'nenhuma irrigação ativa'}
        </span>
      </Card>
    </section>
  );
}
