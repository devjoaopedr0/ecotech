import { useMemo, useState } from 'react';
import Header from '../../../compartilhado/components/Header';
import Card from '../../../compartilhado/components/Card';
import Table from '../../../compartilhado/components/Table';
import StatusBadge from '../../../compartilhado/components/StatusBadge';
import GraficoUmidade from '../../../compartilhado/components/GraficoUmidade';
import ResumoHorta from '../../../compartilhado/components/ResumoHorta';
import AlertList, { itemDoAlerta } from '../../../compartilhado/components/AlertList';
import LimitesETendencia from '../../components/LimitesETendencia';
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
} from '../../../compartilhado/components/icons';
import { useHorta } from '../../../compartilhado/hooks/useHorta';
import { ultimasLeituras, type PeriodoId } from '../../../compartilhado/utils/horta';
import { formatarDataHora, formatarLitros } from '../../../compartilhado/utils/format';
import './VisaoGeral.css';

const PERIODOS: { value: PeriodoId; label: string }[] = [
  { value: '24h', label: 'Últimas 24h' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
];

const CONDICAO = { ensolarado: 'Ensolarado', parcial: 'Parcialmente nublado', nublado: 'Nublado', chuva: 'Chuva' } as const;

export default function VisaoGeral({ openMenu }: { openMenu?: () => void }) {
  const { plantas, leituras: leiturasColetadas, alertas, algumaIrrigando, resumoConsumo, recomendacoes, clima, eficiencia, indicadores: ind } = useHorta();
  const [periodo, setPeriodo] = useState<PeriodoId>('24h');
  const [periodoOpen, setPeriodoOpen] = useState(false);

  const leituras = useMemo(() => ultimasLeituras(leiturasColetadas, plantas), [leiturasColetadas, plantas]);

  return (
    <>
      <Header
        icon={<HomeIcon width={21} height={21} />}
        title="Visão Geral"
        subtitle="Resumo do sistema"
        onOpenMenu={openMenu}
      />
      <div className="page-body">
        <ResumoHorta />

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
            <GraficoUmidade periodo={periodo} />
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
                <AlertList alertas={alertas.map((a) => itemDoAlerta(a, plantas, { nivel: 'detalhado' }))} limite={8} />
                {alertas.length > 8 && <small className="api-hint">+ {alertas.length - 8} alertas de menor prioridade</small>}
              </>
            )}
          </Card>
        </div>

        <div className="vg-bottom-row">
          <Card title="Últimas leituras" icon={<ListIcon width={18} height={18} />}>
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

          <Card title="Resumo rápido" icon={<GridIcon width={18} height={18} />}>
            <div className="quick-grid">
              <div className="quick-item">
                <LeafIcon width={17} height={17} />
                <div>
                  <span className="quick-label">Plantas monitoradas</span>
                  <strong>{ind.plantasComLeitura}</strong>
                </div>
              </div>
              <div className="quick-item">
                <DropletIcon width={17} height={17} />
                <div>
                  <span className="quick-label">Umidade média</span>
                  <strong>{ind.umidadeMedia === null ? '—' : `${ind.umidadeMedia}%`}</strong>
                </div>
              </div>
              <div className="quick-item">
                <WifiIcon width={17} height={17} />
                <div>
                  <span className="quick-label">Sensores online</span>
                  <strong>{ind.dispositivos.online}</strong>
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
                  <strong>{ind.criticas}</strong>
                </div>
              </div>
              <div className="quick-item">
                <WarningIcon width={17} height={17} />
                <div>
                  <span className="quick-label">Plantas em atenção</span>
                  <strong>{ind.atencao}</strong>
                </div>
              </div>
              <div className="quick-item">
                <DropletIcon width={17} height={17} />
                <div>
                  <span className="quick-label">Água economizada (estimada)</span>
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

        <LimitesETendencia />
      </div>
    </>
  );
}
