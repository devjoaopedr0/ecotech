import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePlants } from '../../context/PlantsContext';
import { formatarData, formatarDataHora, formatarDiaMes, formatarHora } from '../../utils/format';
import { periodoPorId, serieUmidade, type PeriodoId } from '../../utils/horta';
import EmptyState from '../EmptyState';

interface Props {
  periodo: PeriodoId;
  /** Quando informado, mostra a planta e compara com a média da horta. */
  plantaId?: string;
  nomePlanta?: string;
  /** Linhas de referência (limites da planta), em %. */
  limites?: { critica: number; minima: number };
  altura?: number;
}

/**
 * Umidade do solo (%) no período, igual nas duas dashboards: mesma série (utils/horta.ts), mesmo visual dos gráficos da avançada.
 * Mostra o que o sistema realmente registrou; sem dados, mostra estado vazio.
 */
export default function GraficoUmidade({ periodo, plantaId, nomePlanta, limites, altura = 230 }: Props) {
  const { leituras, consumo, agora } = usePlants();
  const serie = useMemo(() => serieUmidade(periodo, leituras, consumo, agora, plantaId), [periodo, leituras, consumo, agora, plantaId]);
  const porPlanta = !!plantaId && !serie.indisponivelParaPlanta;
  const nomeSerie = porPlanta ? (nomePlanta ?? 'Planta') : serie.granularidade === 'dia' ? 'Média diária da horta' : 'Média da horta';
  const { pontos, granularidade } = serie;

  if (pontos.length === 0) {
    return <EmptyState titulo="Sem medições neste período" texto="O sistema não tem leituras de umidade registradas para o período e a seleção escolhidos." />;
  }

  const ultimo = pontos[pontos.length - 1];
  const resumo = `${nomeSerie}, ${periodoPorId(periodo).rotulo.toLowerCase()}: ${pontos.length} ${granularidade === 'dia' ? 'dias' : 'leituras'}, de ${formatarDataHora(pontos[0].ts)} a ${formatarDataHora(ultimo.ts)}. Último valor: ${ultimo.valor}%.`;
  const fmtTick = (ts: number) => (granularidade === 'dia' ? formatarDiaMes(ts) : formatarHora(ts));
  const fmtRotulo = (ts: unknown) => (typeof ts === 'number' ? (granularidade === 'dia' ? formatarData(ts) : formatarDataHora(ts)) : String(ts));

  return (
    <figure className="chart-figure" role="img" aria-label={resumo}>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={altura}>
          <LineChart data={pontos}>
            <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={fmtTick} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} minTickGap={28} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 10 }}
              labelStyle={{ color: 'var(--text-secondary)' }}
              labelFormatter={fmtRotulo}
              formatter={(v) => `${v}%`}
            />
            {porPlanta && limites && <ReferenceLine y={limites.minima} stroke="var(--text-muted)" strokeDasharray="4 4" />}
            {porPlanta && limites && <ReferenceLine y={limites.critica} stroke="var(--status-abaixo-fg)" strokeDasharray="4 4" />}
            <Line type="monotone" dataKey="valor" name={nomeSerie} stroke="#22c55e" strokeWidth={2.5} dot={pontos.length <= 12 ? { r: 3 } : false} isAnimationActive={false} />
            {porPlanta && <Line type="monotone" dataKey="comparacao" name="Média da horta" stroke="#2fb6f0" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls isAnimationActive={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        <span><span className="legend-dot legend-dot-green" /> {nomeSerie}</span>
        {porPlanta && <span><span className="legend-dot legend-dot-blue" /> Média da horta</span>}
        {porPlanta && limites && <span><span className="legend-dash" /> Umidade mínima ({limites.minima}%)</span>}
        {porPlanta && limites && <span><span className="legend-dash legend-dash-critical" /> Umidade crítica ({limites.critica}%)</span>}
      </div>
      <small className="api-hint">
        {serie.indisponivelParaPlanta && 'O sistema não guarda histórico diário por planta; exibindo a média da horta. '}
        {granularidade === 'dia' ? 'Média diária de umidade do solo (%).' : `Umidade do solo (%) · ${pontos.length} leituras de ${formatarHora(pontos[0].ts)} a ${formatarHora(ultimo.ts)}.`}
        {periodo === '24h' && ultimo.ts - pontos[0].ts < 20 * 3_600_000 && ' O sistema só tem leituras de parte das últimas 24 h.'}
      </small>
    </figure>
  );
}
