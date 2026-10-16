import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import AlertList from '../../components/AlertList';
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
  WarningIcon,
  ThermometerIcon,
} from '../../components/icons';
import { usePlants, statusDaPlanta } from '../../context/PlantsContext';
import { gerarHistoricoPlanta, VAZAO_LITROS_POR_MIN } from '../../utils/mockData';
import { condicaoSolo, ROTULO_CONDICAO } from '../../utils/calibracao';
import { calcularColheita, taxaSecagem, horasAteCritico, previsaoUmidade, textoHoras } from '../../utils/analise';
import { formatarData, formatarDuracao, formatarHora, formatarLitros } from '../../utils/format';
import type { Periodo } from '../../types';
import './Monitor.css';

const PERIODOS: Periodo[] = ['6h', '12h', '24h', '7d'];
const DURACOES: { valor: number | null; label: string }[] = [
  { valor: 3, label: '3 min' },
  { valor: 5, label: '5 min' },
  { valor: 10, label: '10 min' },
  { valor: null, label: 'Até parar' },
];

export default function Monitor({ openMenu }: { openMenu?: () => void }) {
  const {
    plantas,
    plantaSelecionadaId,
    setPlantaSelecionadaId,
    sessaoDa,
    iniciarIrrigacao,
    pararIrrigacao,
    definirModoIrrigacao,
    alertas,
    historicoIrrigacao,
    saudeDe,
    agora,
    culturas,
  } = usePlants();

  const [seletorAberto, setSeletorAberto] = useState(false);
  const [periodo, setPeriodo] = useState<Periodo>('24h');
  const [duracaoManual, setDuracaoManual] = useState<number | null>(5);

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
  const dados = gerarHistoricoPlanta(planta.id, planta.umidadeAtual, periodo);
  const sessao = sessaoDa(planta.id);
  const saude = saudeDe(planta.id);
  const colheita = calcularColheita(planta, culturas[planta.culturaId], agora);
  const previsao = previsaoUmidade(planta);
  const horasCritico = horasAteCritico(planta);
  // Resposta medida do solo à irrigação (pontos de umidade por minuto de bomba) nesta planta.
  const respostas = historicoIrrigacao.filter((r) => r.plantaId === planta.id && r.duracaoMin > 0);
  const ganhoPorMin = respostas.length ? respostas.reduce((a, r) => a + (r.umidadeDepois - r.umidadeAntes) / r.duracaoMin, 0) / respostas.length : null;
  const alvo = Math.max(planta.faixaMin, planta.umidadeMinima);
  const minutosSugeridos = ganhoPorMin && ganhoPorMin > 0 && planta.umidadeAtual < alvo ? Math.max(1, Math.ceil((alvo - planta.umidadeAtual) / ganhoPorMin)) : null;
  const tendencia = sessao.estado === 'ligada' ? 'subindo' : taxaSecagem(planta) > 0.3 ? 'caindo' : 'estável';
  const irrigando = sessao.estado === 'ligada';
  const alertasDaPlanta = alertas.filter((a) => a.plantaId === planta.id);
  const historicoDaPlanta = historicoIrrigacao.filter((r) => r.plantaId === planta.id);
  const consumoDaPlanta = historicoDaPlanta.reduce((acc, r) => acc + r.litros, 0);

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
                <span>Umidade crítica</span>
                <strong>{planta.umidadeCritica}%</strong>
              </div>
              {saude && (
                <div className="monitor-plant-side-item">
                  <span>Saúde da planta</span>
                  <StatusBadge status={saude.status} label={`${saude.nota}/100 · ${saude.rotulo}`} />
                </div>
              )}
              <div className="monitor-plant-side-item">
                <span>Status</span>
                <StatusBadge status={status} />
              </div>
            </div>
          </Card>

          <Card title="Controles de Irrigação" icon={<DropletIcon width={18} height={18} />} className="monitor-controls-card">
            <div className="monitor-controls-grid">
              <button
                className={`control-btn control-green ${irrigando ? 'control-active' : ''}`}
                onClick={() => iniciarIrrigacao(planta.id, duracaoManual)}
                disabled={irrigando}
              >
                <PlayIcon width={20} height={20} />
                Ligar
              </button>
              <button
                className={`control-btn ${!irrigando ? 'control-active' : ''}`}
                onClick={() => pararIrrigacao(planta.id)}
              >
                <StopIcon width={20} height={20} />
                Desligar
              </button>
              <button
                className={`control-btn ${sessao.modo === 'automatico' ? 'control-active' : ''}`}
                onClick={() => definirModoIrrigacao(planta.id, 'automatico')}
              >
                <AutoIcon width={20} height={20} />
                Automático
              </button>
              <button
                className={`control-btn ${sessao.modo === 'manual' ? 'control-active' : ''}`}
                onClick={() => definirModoIrrigacao(planta.id, 'manual')}
              >
                <HandIcon width={20} height={20} />
                Manual
              </button>
            </div>
            <div className="monitor-last-irrig">
              <ClockIcon width={16} height={16} />
              <div>
                <span>Tempo de irrigação (ao ligar manualmente)</span>
                <div className="period-toggle">
                  {DURACOES.map((d) => (
                    <button
                      key={d.label}
                      className={`period-btn ${duracaoManual === d.valor ? 'period-btn-active' : ''}`}
                      onClick={() => setDuracaoManual(d.valor)}
                      disabled={irrigando}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                {minutosSugeridos && (
                  <small className="api-hint">
                    Sugestão: ~{minutosSugeridos} min para chegar a {alvo}% (resposta média de {ganhoPorMin!.toFixed(1).replace('.', ',')}% por minuto).
                  </small>
                )}
              </div>
            </div>
            <div className="monitor-last-irrig">
              <DropletIcon width={16} height={16} />
              <div>
                <span>Status da irrigação</span>
                <strong>
                  {irrigando
                    ? `Irrigando há ${formatarDuracao(sessao.decorridoMin)} (${sessao.origem === 'automatica' ? 'automática' : 'manual'}${
                        sessao.duracaoMin ? `, programada ${sessao.duracaoMin} min` : ''
                      })`
                    : 'Desligada'}
                </strong>
              </div>
            </div>
            <div className="monitor-last-irrig">
              <ClockIcon width={16} height={16} />
              <div>
                <span>Última irrigação</span>
                <strong>{planta.ultimaIrrigacao}</strong>
              </div>
            </div>
            <small className="api-hint">Simulação: nenhum equipamento real está conectado.</small>
          </Card>
        </div>

        {alertasDaPlanta.length > 0 && (
          <Card title="Alertas da planta" icon={<WarningIcon width={18} height={18} />}>
            <AlertList alertas={alertasDaPlanta} />
          </Card>
        )}

        <Card title="Previsão de umidade" icon={<ChartLineIcon width={18} height={18} />}>
          {irrigando ? (
            <small className="api-hint">Irrigação em andamento: a previsão volta quando ela terminar.</small>
          ) : (
            <>
              <div className="forecast-row">
                {previsao.map((pt) => (
                  <div key={pt.horas} className="forecast-item">
                    <span>{pt.horas === 0 ? 'Agora' : `Em ${pt.horas}h`}</span>
                    <strong className={pt.critico ? 'forecast-critical' : ''}>{pt.umidade}%</strong>
                  </div>
                ))}
              </div>
              {horasCritico !== null && horasCritico <= 6 && (
                <AlertList
                  alertas={[
                    {
                      id: 'prev-critico',
                      severidade: 'atencao',
                      titulo: 'Umidade em queda',
                      mensagem: `A umidade pode atingir o nível crítico em ${textoHoras(horasCritico)}.`,
                    },
                  ]}
                />
              )}
              <small className="api-hint">Tendência: {tendencia === 'caindo' ? `em queda (≈ ${taxaSecagem(planta).toFixed(1).replace('.', ',')}% por hora)` : 'estável'}. Estimativa sem considerar chuva ou irrigação.</small>
            </>
          )}
        </Card>

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
                <ReferenceLine y={planta.umidadeCritica} stroke="var(--status-abaixo-fg)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="umidade" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <span><span className="legend-dot legend-dot-green" /> Umidade da planta</span>
            <span><span className="legend-dash" /> Faixa ideal ({planta.faixaMin}% - {planta.faixaMax}%)</span>
            <span><span className="legend-dash legend-dash-critical" /> Umidade crítica ({planta.umidadeCritica}%)</span>
          </div>
        </Card>

        <Card title="Histórico de irrigação" icon={<ClockIcon width={18} height={18} />}>
          <Table
            rowKey={(r) => r.id}
            rows={historicoDaPlanta}
            emptyMessage="Nenhuma irrigação registrada para esta planta."
            columns={[
              { key: 'data', header: 'Data', render: (r) => formatarData(r.timestamp) },
              { key: 'hora', header: 'Horário', render: (r) => formatarHora(r.timestamp) },
              { key: 'duracao', header: 'Duração', render: (r) => formatarDuracao(r.duracaoMin) },
              { key: 'modo', header: 'Tipo', render: (r) => (r.modo === 'automatica' ? 'Irrigação automática' : 'Irrigação manual') },
              { key: 'resposta', header: 'Resposta do solo', render: (r) => `${r.umidadeAntes}% → ${r.umidadeDepois}%` },
              { key: 'motivo', header: 'Motivo', render: (r) => r.motivo },
            ]}
          />
        </Card>

        <Card title="Informações da planta" icon={<InfoBoxIcon width={18} height={18} />}>
          <div className="info-grid">
            <div className="info-row"><span><LeafIcon width={15} height={15} /> Nome</span><strong>{planta.nome}</strong></div>
            <div className="info-row"><span>🪴 Tipo</span><strong>{planta.tipo}</strong></div>
            <div className="info-row"><span><CalendarIcon width={15} height={15} /> Data de cadastro</span><strong>{planta.dataCadastro}</strong></div>
            <div className="info-row"><span><DropletIcon width={15} height={15} /> Faixa ideal de umidade</span><strong>{planta.faixaMin}% - {planta.faixaMax}%</strong></div>
            <div className="info-row"><span><DropletIcon width={15} height={15} /> Condição do solo</span><strong>{ROTULO_CONDICAO[condicaoSolo(planta)]}</strong></div>
            <div className="info-row"><span><DropletIcon width={15} height={15} /> Umidade crítica</span><strong>{planta.umidadeCritica}%</strong></div>
            <div className="info-row"><span><ThermometerIcon width={15} height={15} /> Temperatura</span><strong>{planta.temperatura.toFixed(1)}°C</strong></div>
            <div className="info-row"><span><ClockIcon width={15} height={15} /> Última irrigação</span><strong>{planta.ultimaIrrigacao}</strong></div>
            {colheita && (
              <>
                <div className="info-row"><span><CalendarIcon width={15} height={15} /> Plantio</span><strong>{formatarData(colheita.plantio)}</strong></div>
                <div className="info-row"><span><CalendarIcon width={15} height={15} /> Ciclo estimado</span><strong>{culturas[planta.culturaId]?.cicloDias} dias</strong></div>
                <div className="info-row"><span><LeafIcon width={15} height={15} /> Previsão de colheita</span><strong>{formatarData(colheita.previsao)}</strong></div>
                <div className="info-row"><span><ClockIcon width={15} height={15} /> Dias restantes</span><strong>{colheita.diasRestantes > 0 ? `${colheita.diasRestantes} dias` : 'Pronta para colher'}</strong></div>
              </>
            )}
            <div className="info-row"><span><DropletIcon width={15} height={15} /> Consumo de água (registrado)</span><strong>{formatarLitros(consumoDaPlanta)} · {VAZAO_LITROS_POR_MIN} L/min</strong></div>
          </div>
        </Card>
      </div>
    </>
  );
}
