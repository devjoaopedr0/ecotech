import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../compartilhado/components/Header';
import Card from '../../../compartilhado/components/Card';
import Table from '../../../compartilhado/components/Table';
import StatusBadge from '../../../compartilhado/components/StatusBadge';
import GraficoUmidade from '../../../compartilhado/components/GraficoUmidade';
import ResumoHorta from '../../../compartilhado/components/ResumoHorta';
import MapaHorta from '../../../compartilhado/components/MapaHorta';
import EmptyState from '../../../compartilhado/components/EmptyState';
import { ROTAS } from '../../../routes/paths';
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
  MapIcon,
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
  const { plantas, leituras: leiturasColetadas, alertas, algumaIrrigando, resumoConsumo, recomendacoes, clima, eficiencia, indicadores: ind, setPlantaSelecionadaId } = useHorta();
  const navigate = useNavigate();
  const abrirNoMonitor = (id: string) => {
    setPlantaSelecionadaId(id);
    navigate(ROTAS.monitor);
  };
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
          <Card
            title="Umidade ao longo do tempo"
            subtitle="Como a umidade média mudou em relação à faixa ideal?"
            icon={<DropletIcon width={18} height={18} />}
            action={
              <div className="dropdown">
                <button className="dropdown-trigger" onClick={() => setPeriodoOpen((v) => !v)} aria-expanded={periodoOpen} aria-haspopup="listbox">
                  {PERIODOS.find((p) => p.value === periodo)?.label}
                  <ChevronDownIcon width={15} height={15} />
                </button>
                {periodoOpen && (
                  <div className="dropdown-menu">
                    {PERIODOS.map((p) => (
                      <button
                        key={p.value}
                        className={`dropdown-item ${p.value === periodo ? 'dropdown-item-active' : ''}`}
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
            <GraficoUmidade periodo={periodo} altura={260} />
          </Card>

          <Card
            title="Alertas importantes"
            subtitle={alertas.length ? `${alertas.length} ocorrências · mais graves primeiro` : 'O que exige ação agora?'}
            icon={<BellIcon width={18} height={18} />}
            className="vg-alertas"
          >
            {alertas.length === 0 ? (
              <EmptyState icone={<BellIcon width={30} height={30} />} titulo="Nenhum alerta no momento" texto="Todos os sensores e plantas estão dentro dos limites configurados." />
            ) : (
              <div className="painel-rolagem" tabIndex={0} aria-label="Lista de alertas (role para ver mais)">
                <AlertList alertas={alertas.map((a) => itemDoAlerta(a, plantas, { nivel: 'detalhado' }))} />
              </div>
            )}
          </Card>
        </div>

        <Card
          title="Mapa da horta · telemetria"
          subtitle="Estado de cada planta por canteiro, com sensor, leitura bruta e parâmetros"
          icon={<MapIcon width={18} height={18} />}
        >
          <MapaHorta modo="tecnico" onAbrir={abrirNoMonitor} rotuloAbrir="Abrir no Monitor" />
        </Card>

        <div className="vg-mid-row">
          <Card title="Recomendações" subtitle="Ações sugeridas a partir de clima, tendência e consumo" icon={<LeafIcon width={18} height={18} />}>
            {recomendacoes.length === 0 ? (
              <EmptyState icone={<HealthyIcon width={30} height={30} />} titulo="Nenhuma recomendação" texto="A horta está dentro do esperado." />
            ) : (
              <AlertList alertas={recomendacoes} />
            )}
          </Card>

          <Card title="Previsão do tempo" subtitle="Afeta a decisão de irrigar" icon={<CloudIcon width={18} height={18} />}>
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

        <div className="vg-bottom-row">
          <Card title="Últimas leituras" subtitle="Leitura mais recente de cada sensor de umidade" icon={<ListIcon width={18} height={18} />}>
            <Table
              cartoesNoCelular
              legenda="Última leitura de umidade por planta"
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

          <Card title="Resumo rápido" subtitle="Indicadores de operação e eficiência" icon={<GridIcon width={18} height={18} />}>
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
