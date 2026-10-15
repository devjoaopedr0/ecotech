import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
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
} from '../../components/icons';
import { usePlants, statusDaPlanta } from '../../context/PlantsContext';
import { leiturasRecentes, relatorioIrrigacao, umidadeSemanal } from '../../utils/mockData';
import './Dashboard.css';

const PERIODOS = ['Últimos 7 dias', 'Últimos 14 dias', 'Últimos 30 dias'];

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
  const { plantas } = usePlants();
  const [periodo, setPeriodo] = useState(PERIODOS[0]);
  const [periodoOpen, setPeriodoOpen] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [mostrarTodas, setMostrarTodas] = useState(false);

  const umidades = plantas.map((p) => p.umidadeAtual);
  const media = Math.round(umidades.reduce((a, b) => a + b, 0) / (umidades.length || 1));
  const minima = Math.min(...umidades);
  const maxima = Math.max(...umidades);
  const alertasCount = plantas.filter((p) => statusDaPlanta(p) !== 'ideal').length;

  const leituras = mostrarTodas ? leiturasRecentes : leiturasRecentes.slice(0, 5);

  const gerarRelatorio = () => {
    setGerando(true);
    setTimeout(() => {
      baixarCSV(
        `relatorio-irrigacao-${new Date().toISOString().slice(0, 10)}.csv`,
        [
          ['Planta', 'Data', 'Hora'],
          ...relatorioIrrigacao.map((r) => [r.plantaNome, r.data, r.hora]),
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
            <strong>{media}%</strong>
            <span className="dash-stat-trend"><ArrowUpIcon width={13} height={13} /> 5% (últimas 24h)</span>
          </Card>
          <Card className="dash-stat">
            <span className="dash-stat-label"><LeafIcon width={16} height={16} /> Mínima</span>
            <strong>{Number.isFinite(minima) ? minima : 0}%</strong>
            <span className="dash-stat-sub">(últimas 24h)</span>
          </Card>
          <Card className="dash-stat">
            <span className="dash-stat-label"><LeafIcon width={16} height={16} /> Máxima</span>
            <strong>{Number.isFinite(maxima) ? maxima : 0}%</strong>
            <span className="dash-stat-sub">(últimas 24h)</span>
          </Card>
          <Card className="dash-stat">
            <span className="dash-stat-label"><LeafIcon width={16} height={16} /> Plantas ativas</span>
            <strong>{plantas.length}</strong>
            <span className="dash-stat-sub">de {plantas.length} cadastradas</span>
          </Card>
          <Card className="dash-stat">
            <span className="dash-stat-label"><DropletIcon width={16} height={16} /> Irrigação</span>
            <strong className="txt-ok">Ativa</strong>
            <span className="dash-stat-sub"><span className="dot dot-on" /> em andamento</span>
          </Card>
        </div>

        <div className="dash-mid-row">
          <Card
            title="Umidade ao longo do tempo"
            icon={<DropletIcon width={18} height={18} />}
            action={
              <div className="dropdown">
                <button className="dropdown-trigger" onClick={() => setPeriodoOpen((v) => !v)}>
                  {periodo}
                  <ChevronDownIcon width={15} height={15} />
                </button>
                {periodoOpen && (
                  <div className="dropdown-menu">
                    {PERIODOS.map((p) => (
                      <button key={p} className="dropdown-item" onClick={() => { setPeriodo(p); setPeriodoOpen(false); }}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            }
          >
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={umidadeSemanal}>
                  <defs>
                    <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2fb6f0" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#2fb6f0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="hora" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 10 }} labelStyle={{ color: 'var(--text-secondary)' }} />
                  <Area type="monotone" dataKey="umidade" stroke="#22c55e" fill="url(#dashArea)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="dash-side-col">
            <Card title="Filtro de período" icon={<CalendarIcon width={18} height={18} />}>
              <div className="dropdown dash-filter-dropdown">
                <button className="dropdown-trigger dropdown-trigger-block" onClick={() => setPeriodoOpen((v) => !v)}>
                  {periodo}
                  <ChevronDownIcon width={15} height={15} />
                </button>
                {periodoOpen && (
                  <div className="dropdown-menu dropdown-menu-block">
                    {PERIODOS.map((p) => (
                      <button key={p} className="dropdown-item" onClick={() => { setPeriodo(p); setPeriodoOpen(false); }}>
                        {p}
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
                rowKey={(r) => r.id}
                rows={leituras}
                columns={[
                  { key: 'planta', header: 'Planta', render: (r) => r.plantaNome },
                  { key: 'umidade', header: 'Umidade', render: (r) => `${r.umidade}%` },
                  { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                  { key: 'horario', header: 'Horário', render: (r) => r.horario },
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
                <strong>{media}%</strong>
              </div>
              <div className="stats-item">
                <span className="stats-item-label">↓ Mínima registrada</span>
                <strong>{Number.isFinite(minima) ? minima : 0}%</strong>
              </div>
              <div className="stats-item">
                <span className="stats-item-label">↑ Máxima registrada</span>
                <strong>{Number.isFinite(maxima) ? maxima : 0}%</strong>
              </div>
            </div>
          </Card>

          <Card title="Status da horta" icon={<LeafIcon width={18} height={18} />}>
            <div className="status-horta">
              <div className={`status-horta-ring ${alertasCount > 0 ? 'ring-warning' : 'ring-ok'}`}>
                <HealthyIcon width={30} height={30} />
              </div>
              <div>
                <strong>{alertasCount > 0 ? 'Atenção' : 'Saudável'}</strong>
                <p>{alertasCount > 0 ? `${alertasCount} planta(s) precisam de atenção.` : 'Tudo funcionando normalmente.'}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Relatório de Irrigação" icon={<DocumentIcon width={18} height={18} />}>
          <Table
            rowKey={(r) => r.id}
            rows={relatorioIrrigacao}
            columns={[
              { key: 'planta', header: 'Planta', render: (r) => r.plantaNome },
              { key: 'data', header: 'Data', render: (r) => r.data },
              { key: 'hora', header: 'Hora', render: (r) => r.hora },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
