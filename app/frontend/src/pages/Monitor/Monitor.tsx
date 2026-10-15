import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import Header from '../../components/Header';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import {
  DropletIcon,
  LeafIcon,
  ChevronDownIcon,
  PlayIcon,
  StopIcon,
  AutoIcon,
  HandIcon,
  ClockIcon,
  ChartLineIcon,
  InfoBoxIcon,
  CalendarIcon,
} from '../../components/icons';
import { usePlants, statusDaPlanta } from '../../context/PlantsContext';
import { historicoPorPeriodo } from '../../utils/mockData';
import type { Periodo } from '../../types';
import './Monitor.css';

const PERIODOS: Periodo[] = ['6h', '12h', '24h', '7d'];

export default function Monitor({ openMenu }: { openMenu?: () => void }) {
  const {
    plantas,
    plantaSelecionadaId,
    setPlantaSelecionadaId,
    irrigacaoEstado,
    irrigacaoModo,
    ligarIrrigacao,
    desligarIrrigacao,
    setModoAutomatico,
    setModoManual,
  } = usePlants();

  const [seletorAberto, setSeletorAberto] = useState(false);
  const [periodo, setPeriodo] = useState<Periodo>('24h');

  const planta = useMemo(
    () => plantas.find((p) => p.id === plantaSelecionadaId) || plantas[0],
    [plantas, plantaSelecionadaId]
  );

  if (!planta) {
    return (
      <>
        <Header icon={<DropletIcon width={21} height={21} />} title="Monitor" subtitle="Acompanhe o tempo real de cada planta" onOpenMenu={openMenu} />
        <div className="page-body">
          <Card>Nenhuma planta cadastrada ainda.</Card>
        </div>
      </>
    );
  }

  const status = statusDaPlanta(planta);
  const dados = historicoPorPeriodo[periodo];

  return (
    <>
      <Header icon={<DropletIcon width={21} height={21} />} title="Monitor" subtitle="Acompanhe o tempo real de cada planta" onOpenMenu={openMenu} />
      <div className="page-body">
        <Card>
          <div className="monitor-select-row">
            <span className="monitor-select-label"><LeafIcon width={16} height={16} /> Selecionar planta</span>
            <div className="dropdown monitor-select-dropdown">
              <button className="dropdown-trigger dropdown-trigger-block" onClick={() => setSeletorAberto((v) => !v)}>
                {planta.nome}
                <ChevronDownIcon width={15} height={15} />
              </button>
              {seletorAberto && (
                <div className="dropdown-menu dropdown-menu-block">
                  {plantas.map((p) => (
                    <button
                      key={p.id}
                      className="dropdown-item"
                      onClick={() => {
                        setPlantaSelecionadaId(p.id);
                        setSeletorAberto(false);
                      }}
                    >
                      {p.emoji} {p.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="monitor-main-row">
          <Card className="monitor-plant-card">
            <div className="monitor-plant-ring">
              <span style={{ fontSize: 40 }}>{planta.emoji}</span>
            </div>
            <div className="monitor-plant-info">
              <h3>
                <LeafIcon width={17} height={17} /> {planta.nome}
              </h3>
              <span className="monitor-plant-local">{planta.local}</span>
              <div className="monitor-plant-metric">
                <span><DropletIcon width={15} height={15} /> Umidade atual</span>
                <strong>{planta.umidadeAtual}%</strong>
                <div className="monitor-bar">
                  <div className="monitor-bar-fill" style={{ width: `${planta.umidadeAtual}%` }} />
                </div>
              </div>
            </div>
            <div className="monitor-plant-side">
              <div className="monitor-plant-side-item">
                <span>Faixa ideal de umidade</span>
                <strong>{planta.faixaMin}% - {planta.faixaMax}%</strong>
              </div>
              <div className="monitor-plant-side-item">
                <span>Status</span>
                <StatusBadge status={status} />
              </div>
            </div>
          </Card>

          <Card title="Controles de Irrigação" icon={<DropletIcon width={18} height={18} />} className="monitor-controls-card">
            <div className="monitor-controls-grid">
              <button
                className={`control-btn control-green ${irrigacaoEstado === 'ligada' ? 'control-active' : ''}`}
                onClick={ligarIrrigacao}
              >
                <PlayIcon width={20} height={20} />
                Ligar
              </button>
              <button
                className={`control-btn ${irrigacaoEstado === 'desligada' ? 'control-active' : ''}`}
                onClick={desligarIrrigacao}
              >
                <StopIcon width={20} height={20} />
                Desligar
              </button>
              <button
                className={`control-btn ${irrigacaoModo === 'automatico' ? 'control-active' : ''}`}
                onClick={setModoAutomatico}
              >
                <AutoIcon width={20} height={20} />
                Automático
              </button>
              <button
                className={`control-btn ${irrigacaoModo === 'manual' ? 'control-active' : ''}`}
                onClick={setModoManual}
              >
                <HandIcon width={20} height={20} />
                Manual
              </button>
            </div>
            <div className="monitor-last-irrig">
              <ClockIcon width={16} height={16} />
              <div>
                <span>Última irrigação</span>
                <strong>{planta.ultimaIrrigacao}</strong>
              </div>
            </div>
          </Card>
        </div>

        <Card
          title="Histórico de umidade"
          icon={<ChartLineIcon width={18} height={18} />}
          action={
            <div className="period-toggle">
              {PERIODOS.map((p) => (
                <button
                  key={p}
                  className={`period-btn ${periodo === p ? 'period-btn-active' : ''}`}
                  onClick={() => setPeriodo(p)}
                >
                  {p}
                </button>
              ))}
              <button className="period-btn period-btn-icon" aria-label="Selecionar data personalizada">
                <CalendarIcon width={15} height={15} />
              </button>
            </div>
          }
        >
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={dados}>
                <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="hora" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 10 }} labelStyle={{ color: 'var(--text-secondary)' }} />
                <ReferenceLine y={planta.faixaMin} stroke="var(--text-muted)" strokeDasharray="4 4" />
                <ReferenceLine y={planta.faixaMax} stroke="var(--text-muted)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="umidade" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <span><span className="legend-dot legend-dot-green" /> Umidade da planta</span>
            <span><span className="legend-dash" /> Faixa ideal ({planta.faixaMin}% - {planta.faixaMax}%)</span>
          </div>
        </Card>

        <Card title="Informações da planta" icon={<InfoBoxIcon width={18} height={18} />}>
          <div className="info-grid">
            <div className="info-row"><span><LeafIcon width={15} height={15} /> Nome</span><strong>{planta.nome}</strong></div>
            <div className="info-row"><span>🪴 Tipo</span><strong>{planta.tipo}</strong></div>
            <div className="info-row"><span><CalendarIcon width={15} height={15} /> Data de cadastro</span><strong>{planta.dataCadastro}</strong></div>
            <div className="info-row"><span><DropletIcon width={15} height={15} /> Faixa ideal de umidade</span><strong>{planta.faixaMin}% - {planta.faixaMax}%</strong></div>
            <div className="info-row"><span><ClockIcon width={15} height={15} /> Última irrigação</span><strong>{planta.ultimaIrrigacao}</strong></div>
          </div>
        </Card>
      </div>
    </>
  );
}
