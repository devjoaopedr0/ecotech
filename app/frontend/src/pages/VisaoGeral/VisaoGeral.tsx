import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import AlertList from '../../components/AlertList';
import {
  HomeIcon,
  DropletIcon,
  LeafIcon,
  BellIcon,
  WifiIcon,
  ListIcon,
  GridIcon,
  HealthyIcon,
  WarningIcon,
  CloudIcon,
  CloudRainIcon,
  SunIcon,
  ChevronDownIcon,
} from '../../components/icons';
import { usePlants, statusDaPlanta } from '../../context/PlantsContext';
import { gerarLeiturasRecentes, historicoPorPeriodo } from '../../utils/mockData';
import { formatarLitros } from '../../utils/format';
import './VisaoGeral.css';

const PERIODOS = [
  { value: '24h', label: 'Últimas 24h' },
  { value: '7d', label: 'Últimos 7 dias' },
];

const CONDICAO = { ensolarado: 'Ensolarado', parcial: 'Parcialmente nublado', nublado: 'Nublado', chuva: 'Chuva' } as const;

export default function VisaoGeral({ openMenu }: { openMenu?: () => void }) {
  const { plantas, sensores, alertas, algumaIrrigando, irrigacoesAtivas, resumoConsumo, recomendacoes, clima, eficiencia } = usePlants();
  const [periodo, setPeriodo] = useState('24h');
  const [periodoOpen, setPeriodoOpen] = useState(false);

  const umidadeMedia = useMemo(
    () => Math.round(plantas.reduce((acc, p) => acc + p.umidadeAtual, 0) / (plantas.length || 1)),
    [plantas]
  );

  const criticas = useMemo(() => plantas.filter((p) => statusDaPlanta(p) === 'critico').length, [plantas]);
  const emAtencao = useMemo(() => plantas.filter((p) => statusDaPlanta(p) === 'atencao').length, [plantas]);
  const leituras = useMemo(() => gerarLeiturasRecentes(plantas, sensores), [plantas, sensores]);
  const sensoresOffline = sensores.filter((s) => s.status === 'offline').length;
  const sensoresOnline = sensores.length - sensoresOffline;

  const saude =
    criticas > 0
      ? { nivel: 'critico', titulo: 'Horta em estado crítico', texto: `${criticas} planta(s) com umidade crítica.` }
      : alertas.some((a) => a.severidade !== 'ideal')
        ? { nivel: 'atencao', titulo: 'Horta requer atenção', texto: 'Há alertas que precisam ser verificados.' }
        : { nivel: 'ok', titulo: 'Horta saudável', texto: 'Tudo funcionando normalmente.' };

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
          <Card accent={saude.nivel === 'ok' ? 'success' : 'default'} className="vg-health-card">
            <div className={`vg-health-icon ${saude.nivel !== 'ok' ? `vg-health-icon-${saude.nivel}` : ''}`}>
              {saude.nivel === 'ok' ? <HealthyIcon width={26} height={26} /> : <WarningIcon width={26} height={26} />}
            </div>
            <div>
              <h2>{saude.titulo}</h2>
              <p>{saude.texto}</p>
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
            <strong className={algumaIrrigando ? 'txt-ok' : ''}>
              {algumaIrrigando ? 'Ativada' : 'Desativada'}
            </strong>
            <span className="vg-mini-sub">
              <span className={`dot ${algumaIrrigando ? 'dot-on' : 'dot-off'}`} />
              {algumaIrrigando ? `${irrigacoesAtivas} em andamento` : 'em espera'}
            </span>
          </Card>

          <Card className="vg-mini-card">
            <span className="vg-mini-label">
              <WifiIcon width={16} height={16} /> Sensores
            </span>
            <strong className={sensoresOffline === 0 ? 'txt-ok' : ''}>{sensoresOffline === 0 ? 'Online' : `${sensoresOffline} offline`}</strong>
            <span className="vg-mini-sub">
              <span className={`dot ${sensoresOffline === 0 ? 'dot-on' : 'dot-off'}`} />
              {sensoresOnline} de {sensores.length} conectados
            </span>
          </Card>
        </div>

        <div className="vg-mid-row">
          <Card title="Recomendações" icon={<LeafIcon width={18} height={18} />}>
            {recomendacoes.length === 0 ? (
              <div className="empty-state">
                <HealthyIcon width={30} height={30} />
                <strong>Nenhuma recomendação</strong>
                <span>A horta está dentro do esperado.</span>
              </div>
            ) : (
              <AlertList alertas={recomendacoes} />
            )}
          </Card>

          <Card title="Previsão do tempo" icon={<CloudIcon width={18} height={18} />}>
            <div className="weather-main">
              {clima.condicao === 'chuva' ? <CloudRainIcon width={34} height={34} /> : clima.condicao === 'ensolarado' ? <SunIcon width={34} height={34} /> : <CloudIcon width={34} height={34} />}
              <div>
                <strong>{clima.temperaturaAtual}°C</strong>
                <span>{CONDICAO[clima.condicao]}</span>
              </div>
            </div>
            <div className="info-row"><span>Máxima / Mínima</span><strong>{clima.maxima}° / {clima.minima}°</strong></div>
            <div className="info-row"><span>Probabilidade de chuva</span><strong>{clima.probabilidadeChuva}%</strong></div>
            <div className="info-row"><span>Chuva prevista</span><strong>{clima.chuvaEmHoras === null ? 'Sem chuva' : `em ~${clima.chuvaEmHoras} h`}</strong></div>
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
              <>
                <AlertList alertas={alertas} limite={8} />
                {alertas.length > 8 && <small className="api-hint">+ {alertas.length - 8} alertas de menor prioridade</small>}
              </>
            )}
          </Card>
        </div>

        <div className="vg-bottom-row">
          <Card title="Últimas leituras" icon={<ListIcon width={18} height={18} />}>
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
                  <strong>{sensoresOnline}</strong>
                </div>
              </div>
              <div className="quick-item">
                <DropletIcon width={17} height={17} />
                <div>
                  <span className="quick-label">Irrigação</span>
                  <strong>{algumaIrrigando ? 'Ativada' : 'Desativada'}</strong>
                </div>
              </div>
              <div className="quick-item">
                <WarningIcon width={17} height={17} />
                <div>
                  <span className="quick-label">Plantas críticas</span>
                  <strong>{criticas}</strong>
                </div>
              </div>
              <div className="quick-item">
                <WarningIcon width={17} height={17} />
                <div>
                  <span className="quick-label">Plantas em atenção</span>
                  <strong>{emAtencao}</strong>
                </div>
              </div>
              <div className="quick-item">
                <DropletIcon width={17} height={17} />
                <div>
                  <span className="quick-label">Água economizada</span>
                  <strong>{formatarLitros(resumoConsumo.economizada)}</strong>
                </div>
              </div>
              <div className="quick-item">
                <LeafIcon width={17} height={17} />
                <div>
                  <span className="quick-label">Eficiência da Ecotech</span>
                  <strong title={`Principal ponto de melhoria: ${eficiencia.pontoFraco}`}>{eficiencia.indice}%</strong>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
