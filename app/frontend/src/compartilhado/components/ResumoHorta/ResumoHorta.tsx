import { useHorta } from '../../hooks/useHorta';
import type { NivelDashboard } from '../../types';
import { formatarRelativo } from '../../utils/format';
import Card from '../Card';
import { DropletIcon, HealthyIcon, LeafIcon, ThermometerIcon, WarningIcon, WifiIcon } from '../icons';

/**
 * Linha de abertura da Visão Geral nas duas dashboards: situação da horta, umidade média, plantas, irrigação e sensores.
 * Todos os valores vêm de useHorta (mesma fonte e mesmas regras), então os números são idênticos nos dois níveis.
 * Intermediária: só o essencial (situação, umidade e irrigação). Temperatura, contagem de plantas e resumo de sensores
 * ficam na avançada; na intermediária as plantas têm página própria e os sensores um bloco próprio (EstadoSensores).
 */
export default function ResumoHorta({ nivel = 'avancado' }: { nivel?: NivelDashboard }) {
  const { indicadores: ind, situacao, algumaIrrigando, irrigacoesAtivas, agora } = useHorta();
  const essencial = nivel === 'intermediario';
  const temperatura = !essencial && ind.temperatura;

  return (
    <section className={`vg-top-row ${essencial ? 'vg-top-row-3' : temperatura ? 'vg-top-row-6' : ''}`} aria-label="Resumo da horta">
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
        <span className="vg-mini-label">
          <DropletIcon width={16} height={16} /> Umidade atual
        </span>
        <strong>{ind.umidadeMedia === null ? '—' : `${ind.umidadeMedia}%`}</strong>
        <span className="vg-mini-sub">
          {ind.ultimaLeituraMs ? `Última leitura: ${formatarRelativo(ind.ultimaLeituraMs, agora)}` : 'Sem leitura confiável disponível'}
        </span>
      </Card>

      {temperatura && (
        <Card className="vg-mini-card">
          <span className="vg-mini-label">
            <ThermometerIcon width={16} height={16} /> Temperatura
          </span>
          <strong>{temperatura.media.toFixed(1).replace('.', ',')} °C</strong>
          <span className="vg-mini-sub">
            {temperatura.sensores === 1
              ? '1 sensor online'
              : `média de ${temperatura.sensores} sensores · ${temperatura.min.toFixed(1).replace('.', ',')}–${temperatura.max.toFixed(1).replace('.', ',')} °C`}
          </span>
        </Card>
      )}

      {!essencial && (
        <Card className="vg-mini-card">
          <span className="vg-mini-label">
            <LeafIcon width={16} height={16} /> Plantas monitoradas
          </span>
          <strong>{ind.plantasComLeitura}</strong>
          <span className="vg-mini-sub">
            de {ind.totalPlantas} cadastradas{ind.semDados > 0 ? ` · ${ind.semDados} sem leitura` : ''}
          </span>
        </Card>
      )}

      <Card className="vg-mini-card">
        <span className="vg-mini-label">
          <DropletIcon width={16} height={16} /> Irrigação
        </span>
        <strong className={algumaIrrigando ? 'txt-ok' : ''}>{algumaIrrigando ? 'Ativada' : 'Desativada'}</strong>
        <span className="vg-mini-sub">
          <span className={`dot ${algumaIrrigando ? 'dot-on' : 'dot-off'}`} />
          {algumaIrrigando ? `${irrigacoesAtivas} em andamento` : 'em espera'}
        </span>
      </Card>

      {!essencial && (
        <Card className="vg-mini-card">
          <span className="vg-mini-label">
            <WifiIcon width={16} height={16} /> Sensores
          </span>
          <strong className={ind.dispositivos.offline === 0 ? 'txt-ok' : ''}>{ind.dispositivos.offline === 0 ? 'Online' : `${ind.dispositivos.offline} offline`}</strong>
          <span className="vg-mini-sub">
            <span className={`dot ${ind.dispositivos.offline === 0 ? 'dot-on' : 'dot-off'}`} />
            {ind.dispositivos.online} de {ind.dispositivos.total} conectados
          </span>
        </Card>
      )}
    </section>
  );
}
