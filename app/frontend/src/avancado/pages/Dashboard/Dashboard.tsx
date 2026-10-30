import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '../../../compartilhado/components/Header';
import Card from '../../../compartilhado/components/Card';
import Table from '../../../compartilhado/components/Table';
import StatusBadge from '../../../compartilhado/components/StatusBadge';
import GraficoUmidade from '../../../compartilhado/components/GraficoUmidade';
import {
  DashboardIcon,
  DropletIcon,
  LeafIcon,
  ChevronDownIcon,
  CalendarIcon,
  DocumentIcon,
  ClockIcon,
  StatsIcon,
  HealthyIcon,
  ArrowUpIcon,
  WarningIcon,
} from '../../../compartilhado/components/icons';
import { useHorta } from '../../../compartilhado/hooks/useHorta';
import ComparacaoPeriodos from '../../components/ComparacaoPeriodos';
import { serieUmidade, ultimasLeituras, variacaoDaSerie, type PeriodoId } from '../../../compartilhado/utils/horta';
import { formatarReais } from '../../../compartilhado/utils/analise';
import { formatarData, formatarDataHora, formatarDuracao, formatarHora, formatarLitros } from '../../../compartilhado/utils/format';
import './Dashboard.css';

const PERIODOS: { id: PeriodoId; label: string }[] = [
  { id: '7d', label: 'Últimos 7 dias' },
  { id: '14d', label: 'Últimos 14 dias' },
  { id: '30d', label: 'Últimos 30 dias' },
];

function baixarCSV(nomeArquivo: string, linhas: string[][]) {
  const conteudo = linhas.map((l) => l.join(',')).join('\n');
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Dashboard({ openMenu }: { openMenu?: () => void }) {
  const { plantas, algumaIrrigando, irrigacoesAtivas, historicoIrrigacao, consumo, resumoConsumo, alertas, tarifaM3, leituras: leiturasColetadas, agora, indicadores: ind, situacao } = useHorta();
  const [periodo, setPeriodo] = useState<PeriodoId>('7d');
  const [periodoOpen, setPeriodoOpen] = useState(false);
  const [filtroOpen, setFiltroOpen] = useState(false); // menu do cartão "Filtro de período" (independente do menu do gráfico)
  const [gerando, setGerando] = useState(false);
  const [mostrarTodas, setMostrarTodas] = useState(false);

  const rotuloPeriodo = PERIODOS.find((p) => p.id === periodo)?.label ?? '';
  const variacao24h = useMemo(() => variacaoDaSerie(serieUmidade('24h', leiturasColetadas, consumo, agora).pontos), [leiturasColetadas, consumo, agora]);
  const umidadesCriticas = alertas.filter((a) => a.tipo === 'umidade_critica').length;
  const pct = (v: number | null) => (v === null ? '—' : `${v}%`);

  const todasLeituras = useMemo(() => ultimasLeituras(leiturasColetadas, plantas), [leiturasColetadas, plantas]);
  const leituras = mostrarTodas ? todasLeituras : todasLeituras.slice(0, 5);

  const gerarRelatorio = () => {
    setGerando(true);
    setTimeout(() => {
      baixarCSV(
        `relatorio-irrigacao-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          ['Planta', 'Canteiro', 'Data', 'Hora', 'Duração (min)', 'Modo', 'Motivo', 'Água (L)', 'Umidade antes (%)', 'Umidade depois (%)'],
          ...historicoIrrigacao.map((r) => [
            r.plantaNome,
            r.canteiro,
            formatarData(r.timestamp),
            formatarHora(r.timestamp),
            String(r.duracaoMin),
            r.modo === 'automatica' ? 'Automática' : 'Manual',
            `"${r.motivo}"`,
            String(r.litros),
            String(r.umidadeAntes),
            String(r.umidadeDepois),
          ]),
        ]
      );
      setGerando(false);
    }, 400);
  };

  return (
    <>
      <Header icon={<DashboardIcon width={21} height={21} />} title="Dashboard" subtitle="Dados, gráficos e relatórios" onOpenMenu={openMenu} />
      <div className="page-body">
        <div className="dash-stats-row">
          <Card className="dash-stat">
            <span className="dash-stat-label"><DropletIcon width={16} height={16} /> Umidade média</span>
            <strong>{pct(ind.umidadeMedia)}</strong>
            {variacao24h === null ? (
              <span className="dash-stat-sub">sem variação registrada nas últimas 24h</span>
            ) : (
              <span className="dash-stat-trend">{variacao24h >= 0 ? <ArrowUpIcon width={13} height={13} /> : <span aria-hidden="true">↓</span>} {variacao24h > 0 ? `+${variacao24h}` : variacao24h} p.p. (últimas 24h, média da horta)</span>
            )}
          </Card>
          <Card className="dash-stat">
            <span className="dash-stat-label"><LeafIcon width={16} height={16} /> Mínima</span>
            <strong>{pct(ind.umidadeMinima)}</strong>
            <span className="dash-stat-sub">entre as plantas, agora</span>
          </Card>
          <Card className="dash-stat">
            <span className="dash-stat-label"><LeafIcon width={16} height={16} /> Máxima</span>
            <strong>{pct(ind.umidadeMaxima)}</strong>
            <span className="dash-stat-sub">entre as plantas, agora</span>
          </Card>
          <Card className="dash-stat">
            <span className="dash-stat-label"><LeafIcon width={16} height={16} /> Plantas cadastradas</span>
            <strong>{ind.totalPlantas}</strong>
            <span className="dash-stat-sub">{ind.plantasComLeitura} com leitura confiável</span>
          </Card>
          <Card className="dash-stat">
            <span className="dash-stat-label"><DropletIcon width={16} height={16} /> Irrigação</span>
            <strong className={algumaIrrigando ? 'txt-ok' : ''}>{algumaIrrigando ? 'Ativa' : 'Inativa'}</strong>
            <span className="dash-stat-sub">
              <span className={`dot ${algumaIrrigando ? 'dot-on' : 'dot-off'}`} /> {algumaIrrigando ? `${irrigacoesAtivas} em andamento` : 'em espera'}
            </span>
          </Card>
        </div>

        <div className="dash-stats-row">
          <Card className="dash-stat">
            <span className="dash-stat-label"><LeafIcon width={16} height={16} /> Plantas monitoradas</span>
            <strong>{ind.plantasComLeitura}</strong>
            <span className="dash-stat-sub">{ind.dispositivos.online} de {ind.dispositivos.total} sensores online{ind.semDados > 0 ? ` · ${ind.semDados} planta(s) sem leitura` : ''}</span>
          </Card>
          <Card className="dash-stat">
            <span className="dash-stat-label"><HealthyIcon width={16} height={16} /> Plantas saudáveis</span>
            <strong className="txt-ok">{ind.saudaveis}</strong>
            <span className="dash-stat-sub">umidade normal</span>
          </Card>
          <Card className="dash-stat">
            <span className="dash-stat-label"><WarningIcon width={16} height={16} /> Plantas em atenção</span>
            <strong>{ind.atencao}</strong>
            <span className="dash-stat-sub">precisam de verificação</span>
          </Card>
          <Card className="dash-stat">
            <span className="dash-stat-label"><WarningIcon width={16} height={16} /> Plantas críticas</span>
            <strong>{ind.criticas}</strong>
            <span className="dash-stat-sub">umidade abaixo do limite</span>
          </Card>
          <Card className="dash-stat">
            <span className="dash-stat-label"><DropletIcon width={16} height={16} /> Umidades críticas</span>
            <strong>{umidadesCriticas}</strong>
            <span className="dash-stat-sub">alertas ativos</span>
          </Card>
        </div>

        <div className="dash-mid-row">
          <Card
            title="Umidade ao longo do tempo"
            icon={<DropletIcon width={18} height={18} />}
            action={
              <div className="dropdown">
                <button className="dropdown-trigger" onClick={() => setPeriodoOpen((v) => !v)}>
                  {rotuloPeriodo}
                  <ChevronDownIcon width={15} height={15} />
                </button>
                {periodoOpen && (
                  <div className="dropdown-menu">
                    {PERIODOS.map((p) => (
                      <button key={p.id} className="dropdown-item" onClick={() => { setPeriodo(p.id); setPeriodoOpen(false); }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            }
          >
            <GraficoUmidade periodo={periodo} />
          </Card>

          <div className="dash-side-col">
            <Card title="Filtro de período" icon={<CalendarIcon width={18} height={18} />}>
              <div className="dropdown dash-filter-dropdown">
                <button className="dropdown-trigger dropdown-trigger-block" onClick={() => setFiltroOpen((v) => !v)}>
                  {rotuloPeriodo}
                  <ChevronDownIcon width={15} height={15} />
                </button>
                {filtroOpen && (
                  <div className="dropdown-menu dropdown-menu-block">
                    {PERIODOS.map((p) => (
                      <button key={p.id} className="dropdown-item" onClick={() => { setPeriodo(p.id); setFiltroOpen(false); }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn btn-primary btn-full dash-report-btn" onClick={gerarRelatorio} disabled={gerando}>
                <DocumentIcon width={17} height={17} />
                {gerando ? 'Gerando…' : 'Gerar Relatório de Irrigação'}
              </button>
            </Card>

            <Card
              title="Últimas leituras"
              icon={<ClockIcon width={18} height={18} />}
              action={
                <button className="link-btn" onClick={() => setMostrarTodas((v) => !v)}>
                  {mostrarTodas ? 'Ver menos' : 'Ver todas'}
                </button>
              }
            >
              <Table
                rowKey={(r) => r.planta.id}
                rows={leituras}
                columns={[
                  { key: 'planta', header: 'Planta', render: (r) => r.planta.nome },
                  { key: 'umidade', header: 'Umidade', render: (r) => (r.medicao ? `${r.medicao.valor}${r.medicao.unidade}` : '—') },
                  { key: 'status', header: 'Status', render: (r) => (r.medicao?.estado ? <StatusBadge status={r.medicao.estado} /> : '—') },
                  { key: 'horario', header: 'Registrada em', render: (r) => (r.medicao ? formatarDataHora(r.medicao.ts) : 'Sem registro') },
                ]}
              />
            </Card>
          </div>
        </div>

        <div className="dash-bottom-row">
          <Card title="Estatísticas" icon={<StatsIcon width={18} height={18} />}>
            <div className="stats-row">
              <div className="stats-item">
                <span className="stats-item-label"><DropletIcon width={15} height={15} /> Média de umidade</span>
                <strong>{pct(ind.umidadeMedia)}</strong>
              </div>
              <div className="stats-item">
                <span className="stats-item-label">↓ Mínima registrada</span>
                <strong>{pct(ind.umidadeMinima)}</strong>
              </div>
              <div className="stats-item">
                <span className="stats-item-label">↑ Máxima registrada</span>
                <strong>{pct(ind.umidadeMaxima)}</strong>
              </div>
            </div>
          </Card>

          <Card title="Status da horta" icon={<LeafIcon width={18} height={18} />}>
            <div className="status-horta">
              <div className={`status-horta-ring ${situacao.nivel === 'ok' ? 'ring-ok' : 'ring-warning'}`}>
                {situacao.nivel === 'ok' ? <HealthyIcon width={30} height={30} /> : <WarningIcon width={30} height={30} />}
              </div>
              <div>
                <strong>{situacao.titulo}</strong>
                <p>{situacao.texto}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="dash-bottom-row">
          <Card title="Consumo de água" icon={<DropletIcon width={18} height={18} />}>
            <div className="stats-row water-stats">
              <div className="stats-item">
                <span className="stats-item-label"><DropletIcon width={15} height={15} /> Água utilizada</span>
                <strong>{formatarLitros(resumoConsumo.utilizada)}</strong>
              </div>
              <div className="stats-item">
                <span className="stats-item-label"><LeafIcon width={15} height={15} /> Água economizada (estimada)</span>
                <strong className="txt-ok">{formatarLitros(resumoConsumo.economizada)}</strong>
              </div>
              <div className="stats-item">
                <span className="stats-item-label"><ArrowUpIcon width={15} height={15} /> Economia (estimada)</span>
                <strong className="txt-ok">{resumoConsumo.percentualEconomia}%</strong>
              </div>
              <div className="stats-item">
                <span className="stats-item-label"><ClockIcon width={15} height={15} /> Custo estimado</span>
                <strong>{formatarReais(resumoConsumo.custo)}</strong>
              </div>
              <div className="stats-item">
                <span className="stats-item-label"><ArrowUpIcon width={15} height={15} /> Economia estimada</span>
                <strong className="txt-ok">{formatarReais(resumoConsumo.economiaEstimada)}</strong>
              </div>
            </div>
            <p className="water-tagline">Mais verde, menos desperdício.</p>
            <small className="api-hint">Últimos 7 dias · valores simulados · economia estimada em relação à irrigação em horário fixo · tarifa R$ {tarifaM3.toFixed(2).replace('.', ',')}/m³.</small>
          </Card>

          <Card title="Histórico de consumo" icon={<StatsIcon width={18} height={18} />}>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={consumo.slice(-7)}>
                  <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="data" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}L`} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 10 }} labelStyle={{ color: 'var(--text-secondary)' }} formatter={(v) => `${v} L`} />
                  <Bar dataKey="convencional" name="Convencional (estimado)" fill="var(--border-strong)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="utilizada" name="Utilizada" fill="#2fb6f0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <ComparacaoPeriodos />

        <Card title="Relatório de Irrigação" icon={<DocumentIcon width={18} height={18} />}>
          <Table
            rowKey={(r) => r.id}
            rows={historicoIrrigacao}
            emptyMessage="Nenhuma irrigação registrada."
            columns={[
              { key: 'planta', header: 'Planta', render: (r) => `${r.plantaNome} · ${r.canteiro}` },
              { key: 'data', header: 'Data', render: (r) => formatarData(r.timestamp) },
              { key: 'hora', header: 'Hora', render: (r) => formatarHora(r.timestamp) },
              { key: 'duracao', header: 'Duração', render: (r) => formatarDuracao(r.duracaoMin) },
              { key: 'modo', header: 'Modo', render: (r) => (r.modo === 'automatica' ? 'Automática' : 'Manual') },
              { key: 'motivo', header: 'Motivo', render: (r) => r.motivo },
              { key: 'agua', header: 'Água', render: (r) => formatarLitros(r.litros) },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
