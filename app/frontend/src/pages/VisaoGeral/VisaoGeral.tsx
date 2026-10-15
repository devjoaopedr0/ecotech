import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import {
  HomeIcon,
  DropletIcon,
  LeafIcon,
  BellIcon,
  WifiIcon,
  ListIcon,
  GridIcon,
  HealthyIcon,
  ChevronDownIcon,
} from '../../components/icons';
import { usePlants, statusDaPlanta } from '../../context/PlantsContext';
import { leiturasRecentes, historicoPorPeriodo } from '../../utils/mockData';
import './VisaoGeral.css';

const PERIODOS = [
  { value: '24h', label: 'Últimas 24h' },
  { value: '7d', label: 'Últimos 7 dias' },
];

export default function VisaoGeral({ openMenu }: { openMenu?: () => void }) {
  const { plantas, irrigacaoEstado } = usePlants();
  const [periodo, setPeriodo] = useState('24h');
  const [periodoOpen, setPeriodoOpen] = useState(false);

  const umidadeMedia = useMemo(
    () => Math.round(plantas.reduce((acc, p) => acc + p.umidadeAtual, 0) / (plantas.length || 1)),
    [plantas]
  );

  const alertas = useMemo(
    () => plantas.filter((p) => statusDaPlanta(p) !== 'ideal'),
    [plantas]
  );

  const dadosGrafico = historicoPorPeriodo[periodo === '24h' ? '24h' : '7d'];

  return (
    <>
      <Header
        icon={<HomeIcon width={21} height={21} />}
        title="Visão Geral"
        subtitle="Resumo do sistema"
        onOpenMenu={openMenu}
      />
      <div className="page-body">
        <div className="vg-top-row">
          <Card accent="success" className="vg-health-card">
            <div className="vg-health-icon">
              <HealthyIcon width={26} height={26} />
            </div>
            <div>
              <h2>Horta saudável</h2>
              <p>Tudo funcionando normalmente.</p>
            </div>
          </Card>

          <Card className="vg-mini-card">
            <span className="vg-mini-label">
              <DropletIcon width={16} height={16} /> Umidade atual
            </span>
            <strong>{umidadeMedia}%</strong>
            <span className="vg-mini-sub">Última leitura: agora</span>
          </Card>

          <Card className="vg-mini-card">
            <span className="vg-mini-label">
              <LeafIcon width={16} height={16} /> Plantas ativas
            </span>
            <strong>{plantas.length}</strong>
            <span className="vg-mini-sub">de {plantas.length} cadastradas</span>
          </Card>

          <Card className="vg-mini-card">
            <span className="vg-mini-label">
              <DropletIcon width={16} height={16} /> Irrigação
            </span>
            <strong className={irrigacaoEstado === 'ligada' ? 'txt-ok' : ''}>
              {irrigacaoEstado === 'ligada' ? 'Ativada' : 'Desativada'}
            </strong>
            <span className="vg-mini-sub">
              <span className={`dot ${irrigacaoEstado === 'ligada' ? 'dot-on' : 'dot-off'}`} />
              {irrigacaoEstado === 'ligada' ? 'em andamento' : 'em espera'}
            </span>
          </Card>

          <Card className="vg-mini-card">
            <span className="vg-mini-label">
              <WifiIcon width={16} height={16} /> Sensores
            </span>
            <strong className="txt-ok">Online</strong>
            <span className="vg-mini-sub">
              <span className="dot dot-on" />
              conectados
            </span>
          </Card>
        </div>

        <div className="vg-mid-row">
          <Card
            title="Umidade ao longo do tempo"
            icon={<DropletIcon width={18} height={18} />}
            action={
              <div className="dropdown">
                <button className="dropdown-trigger" onClick={() => setPeriodoOpen((v) => !v)}>
                  {PERIODOS.find((p) => p.value === periodo)?.label}
                  <ChevronDownIcon width={15} height={15} />
                </button>
                {periodoOpen && (
                  <div className="dropdown-menu">
                    {PERIODOS.map((p) => (
                      <button
                        key={p.value}
                        className="dropdown-item"
                        onClick={() => {
                          setPeriodo(p.value);
                          setPeriodoOpen(false);
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            }
          >
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={dadosGrafico}>
                  <defs>
                    <linearGradient id="vgArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="hora" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 10 }}
                    labelStyle={{ color: 'var(--text-secondary)' }}
                  />
                  <Line type="monotone" dataKey="umidade" stroke="#22c55e" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Alertas importantes" icon={<BellIcon width={18} height={18} />}>
            {alertas.length === 0 ? (
              <div className="empty-state">
                <BellIcon width={30} height={30} />
                <strong>Nenhum alerta no momento</strong>
                <span>Tudo funcionando normalmente.</span>
              </div>
            ) : (
              <ul className="alert-list">
                {alertas.map((p) => (
                  <li key={p.id} className="alert-item">
                    <StatusBadge status={statusDaPlanta(p)} />
                    <span>
                      <strong>{p.nome}</strong> está com {p.umidadeAtual}% de umidade (ideal {p.faixaMin}% - {p.faixaMax}%).
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="vg-bottom-row">
          <Card title="Últimas leituras" icon={<ListIcon width={18} height={18} />}>
            <Table
              rowKey={(r) => r.id}
              rows={leiturasRecentes}
              columns={[
                { key: 'planta', header: 'Planta', render: (r) => r.plantaNome },
                { key: 'umidade', header: 'Umidade', render: (r) => `${r.umidade}%` },
                { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                { key: 'horario', header: 'Horário', render: (r) => r.horario },
              ]}
            />
          </Card>

          <Card title="Resumo rápido" icon={<GridIcon width={18} height={18} />}>
            <div className="quick-grid">
              <div className="quick-item">
                <LeafIcon width={17} height={17} />
                <div>
                  <span className="quick-label">Plantas ativas</span>
                  <strong>{plantas.length}</strong>
                </div>
              </div>
              <div className="quick-item">
                <DropletIcon width={17} height={17} />
                <div>
                  <span className="quick-label">Umidade média</span>
                  <strong>{umidadeMedia}%</strong>
                </div>
              </div>
              <div className="quick-item">
                <WifiIcon width={17} height={17} />
                <div>
                  <span className="quick-label">Sensores online</span>
                  <strong>{plantas.length}</strong>
                </div>
              </div>
              <div className="quick-item">
                <DropletIcon width={17} height={17} />
                <div>
                  <span className="quick-label">Irrigação</span>
                  <strong>{irrigacaoEstado === 'ligada' ? 'Ativada' : 'Desativada'}</strong>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
