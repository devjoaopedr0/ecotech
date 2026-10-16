import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Table from '../../components/Table';
import { DocumentIcon, DropletIcon, StatsIcon, CalendarIcon } from '../../components/icons';
import { usePlants } from '../../context/PlantsContext';
import { baixarCSV } from '../../utils/csv';
import { RESOLUCAO } from '../../utils/calibracao';
import type { FaseLeitura } from '../../types';
import { formatarData, formatarDuracao, formatarHora, formatarLitros } from '../../utils/format';
import { formatarReais, gerarRelatorio, inicioDoDia } from '../../utils/analise';
import './Relatorios.css';

type Filtro = 'hoje' | '7d' | '30d' | 'custom';
const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: 'custom', label: 'Personalizado' },
];
const FASE: Record<FaseLeitura, string> = { rotina: 'Rotina', antes: 'Antes da irrigação', durante: 'Durante', depois: 'Depois da irrigação' };
const DIA = 24 * 60 * 60 * 1000;
const paraInput = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const deInput = (v: string) => new Date(`${v}T00:00:00`).getTime();

export default function Relatorios({ openMenu }: { openMenu?: () => void }) {
  const { consumo, historicoIrrigacao, plantas, alertas, sensores, agora, tarifaM3, leituras, registrarLeituras } = usePlants();
  const hoje = inicioDoDia(agora);
  const [filtro, setFiltro] = useState<Filtro>('7d');
  const [de, setDe] = useState(paraInput(hoje - 6 * DIA));
  const [ate, setAte] = useState(paraInput(hoje));

  const intervalo = useMemo(() => {
    if (filtro === 'hoje') return { inicio: hoje, fim: hoje };
    if (filtro === '7d') return { inicio: hoje - 6 * DIA, fim: hoje };
    if (filtro === '30d') return { inicio: hoje - 29 * DIA, fim: hoje };
    const a = deInput(de);
    const b = deInput(ate);
    return Number.isNaN(a) || Number.isNaN(b) ? { inicio: hoje, fim: hoje } : { inicio: Math.min(a, b), fim: Math.max(a, b) };
  }, [filtro, de, ate, hoje]);

  const r = useMemo(
    () =>
      gerarRelatorio(consumo, historicoIrrigacao, intervalo, {
        ts: hoje,
        umidadeMedia: Math.round(plantas.reduce((a, p) => a + p.umidadeAtual, 0) / Math.max(1, plantas.length)),
        criticas: plantas.filter((p) => p.umidadeAtual < p.umidadeCritica).length,
        alertas: alertas.filter((a) => a.severidade !== 'ideal').length,
      }),
    [consumo, historicoIrrigacao, intervalo, hoje, plantas, alertas]
  );

  const irrigacoes = historicoIrrigacao.filter((x) => x.timestamp >= intervalo.inicio && x.timestamp <= intervalo.fim + DIA - 1);
  const leiturasPeriodo = leituras.filter((l) => l.ts >= intervalo.inicio && l.ts <= intervalo.fim + DIA - 1);
  const exportarLeituras = () =>
    baixarCSV('leituras-umidade.csv', [
      ['Data', 'Hora', 'Planta', 'Sensor', 'Placa', 'Leitura bruta', 'Umidade (%)', 'Fase', 'Profundidade (cm)', 'Posição'],
      ...leiturasPeriodo.map((l) => {
        const sensor = sensores.find((x) => x.plantaId === l.plantaId && x.tipo === 'umidade');
        return [
          formatarData(l.ts), formatarHora(l.ts), l.plantaNome, sensor?.nome ?? `#${l.sensorCodigo}`,
          sensor?.calibracao ? `${sensor.calibracao.placa} (0-${RESOLUCAO[sensor.calibracao.placa]})` : '',
          String(l.bruto), String(l.umidade), FASE[l.fase], String(sensor?.profundidadeCm ?? ''), sensor?.posicao ?? '',
        ];
      }),
    ]);
  const online = sensores.filter((s) => s.status === 'online').length;

  return (
    <>
      <Header icon={<DocumentIcon width={21} height={21} />} title="Relatórios" subtitle="Consumo, economia e desempenho da horta" onOpenMenu={openMenu} />
      <div className="page-body">
        <Card
          title="Período"
          icon={<CalendarIcon width={18} height={18} />}
          action={
            <div className="period-toggle">
              {FILTROS.map((f) => (
                <button key={f.value} className={`period-btn ${filtro === f.value ? 'period-btn-active' : ''}`} onClick={() => setFiltro(f.value)}>
                  {f.label}
                </button>
              ))}
            </div>
          }
        >
          {filtro === 'custom' ? (
            <div className="rel-custom">
              <label>
                De
                <input type="date" value={de} max={ate} onChange={(e) => setDe(e.target.value)} />
              </label>
              <label>
                Até
                <input type="date" value={ate} min={de} max={paraInput(hoje)} onChange={(e) => setAte(e.target.value)} />
              </label>
            </div>
          ) : (
            <span className="rel-range">
              {formatarData(intervalo.inicio)}
              {intervalo.inicio !== intervalo.fim && ` a ${formatarData(intervalo.fim)}`}
            </span>
          )}
        </Card>

        <div className="rel-row">
          <Card title="Resumo do período" icon={<StatsIcon width={18} height={18} />}>
            <div className="info-grid info-grid-1col">
              <div className="info-row"><span>Consumo de água</span><strong>{formatarLitros(r.consumo)} · {formatarReais((r.consumo / 1000) * tarifaM3)}</strong></div>
              <div className="info-row"><span>Água economizada</span><strong className="txt-ok">{formatarLitros(r.economizada)} · {r.percentualEconomia}%</strong></div>
              <div className="info-row"><span>Irrigações</span><strong>{r.irrigacoes}{r.irrigacoes > 0 && ` (${r.irrigacoesAutomaticas} automáticas)`}</strong></div>
              <div className="info-row"><span>Umidade média</span><strong>{r.umidadeMedia === null ? '--' : `${r.umidadeMedia}%`}</strong></div>
              <div className="info-row"><span>Plantas críticas (pico)</span><strong>{r.plantasCriticas}</strong></div>
              <div className="info-row"><span>Alertas</span><strong>{r.alertas}</strong></div>
              <div className="info-row"><span>Sensores online</span><strong>{online} de {sensores.length}</strong></div>
            </div>
            <small className="api-hint">Dados simulados. Dias anteriores vêm do histórico mockado; hoje usa os valores atuais.</small>
          </Card>

          <Card title="Consumo de água" icon={<DropletIcon width={18} height={18} />}>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={r.dias}>
                  <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="data" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}L`} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 10 }} labelStyle={{ color: 'var(--text-secondary)' }} formatter={(v) => `${v} L`} />
                  <Bar dataKey="utilizada" name="Utilizada" fill="#2fb6f0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card title="Irrigações no período" icon={<DropletIcon width={18} height={18} />}>
          <Table
            rowKey={(x) => x.id}
            rows={irrigacoes}
            emptyMessage="Nenhuma irrigação neste período."
            columns={[
              { key: 'planta', header: 'Planta', render: (x) => `${x.plantaNome} · ${x.canteiro}` },
              { key: 'data', header: 'Data', render: (x) => formatarData(x.timestamp) },
              { key: 'hora', header: 'Horário', render: (x) => formatarHora(x.timestamp) },
              { key: 'duracao', header: 'Duração', render: (x) => formatarDuracao(x.duracaoMin) },
              { key: 'modo', header: 'Tipo', render: (x) => (x.modo === 'automatica' ? 'Automática' : 'Manual') },
              { key: 'agua', header: 'Água', render: (x) => formatarLitros(x.litros) },
            ]}
          />
        </Card>

        <Card
          title="Dados coletados"
          icon={<StatsIcon width={18} height={18} />}
          action={
            <div className="rel-actions">
              <Button type="button" variant="secondary" onClick={registrarLeituras}>Registrar leitura agora</Button>
              <Button type="button" variant="secondary" onClick={exportarLeituras} disabled={leiturasPeriodo.length === 0}>Exportar CSV</Button>
            </div>
          }
        >
          <Table
            rowKey={(l) => l.id}
            rows={leiturasPeriodo.slice(0, 8)}
            emptyMessage="Nenhuma leitura registrada neste período."
            columns={[
              { key: 'quando', header: 'Data e hora', render: (l) => `${formatarData(l.ts)} ${formatarHora(l.ts)}` },
              { key: 'planta', header: 'Planta', render: (l) => l.plantaNome },
              { key: 'bruto', header: 'Bruto', render: (l) => l.bruto },
              { key: 'umi', header: 'Umidade', render: (l) => `${l.umidade}%` },
              { key: 'fase', header: 'Fase', render: (l) => FASE[l.fase] },
            ]}
          />
          <small className="api-hint">{leiturasPeriodo.length} leituras no período (mostrando as 8 mais recentes). A análise usa faixas e tendências, não leituras isoladas.</small>
        </Card>
      </div>
    </>
  );
}
