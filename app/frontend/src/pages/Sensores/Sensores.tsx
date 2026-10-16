import { useState } from 'react';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import CalibracaoModal from './CalibracaoModal';
import StatusBadge from '../../components/StatusBadge';
import { WifiIcon, DropletIcon, ThermometerIcon, SunIcon, WaveIcon, ClockIcon, LeafIcon, CloudIcon } from '../../components/icons';
import { usePlants } from '../../context/PlantsContext';
import { formatarRelativo } from '../../utils/format';
import { condicaoSolo, RESOLUCAO, ROTULO_CONDICAO } from '../../utils/calibracao';
import type { Sensor, SensorTipo } from '../../types';
import './Sensores.css';

const TIPOS: { value: SensorTipo | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'umidade', label: 'Umidade' },
  { value: 'temperatura', label: 'Temperatura' },
  { value: 'luminosidade', label: 'Luminosidade' },
  { value: 'nivel_agua', label: 'Nível da água' },
  { value: 'temperatura_folha', label: 'Foliar' },
  { value: 'umidade_ar', label: 'Umidade do ar' },
];

const ROTULO_TIPO: Record<SensorTipo, string> = {
  umidade: 'Sensor de umidade',
  temperatura: 'Sensor de temperatura',
  luminosidade: 'Sensor de luminosidade',
  nivel_agua: 'Sensor de nível da água',
  temperatura_folha: 'Sensor de temperatura foliar',
  umidade_ar: 'Sensor de umidade do ar',
};

const ROTULO_VALOR: Record<SensorTipo, string> = {
  umidade: 'Umidade',
  temperatura: 'Temperatura',
  luminosidade: 'Luminosidade',
  nivel_agua: 'Nível da água',
  temperatura_folha: 'Temperatura foliar',
  umidade_ar: 'Umidade do ar',
};

function IconeSensor({ tipo }: { tipo: SensorTipo }) {
  if (tipo === 'temperatura' || tipo === 'temperatura_folha') return <ThermometerIcon width={18} height={18} />;
  if (tipo === 'luminosidade') return <SunIcon width={18} height={18} />;
  if (tipo === 'nivel_agua') return <WaveIcon width={18} height={18} />;
  if (tipo === 'umidade_ar') return <CloudIcon width={18} height={18} />;
  return <DropletIcon width={18} height={18} />;
}

function formatarValor(s: Sensor): string {
  if (s.tipo === 'temperatura' || s.tipo === 'temperatura_folha') return `${s.valor.toFixed(1)}°C`;
  if (s.tipo === 'luminosidade') return `${s.valor.toLocaleString('pt-BR')} lx`;
  return `${s.valor}%`;
}

export default function Sensores({ openMenu }: { openMenu?: () => void }) {
  const { sensores, plantas, configurarSensor } = usePlants();
  const [calibrando, setCalibrando] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<SensorTipo | 'todos'>('todos');
  const [agora] = useState(() => Date.now());

  const online = sensores.filter((s) => s.status === 'online').length;
  const nivel = sensores.find((s) => s.tipo === 'nivel_agua');
  const visiveis = filtro === 'todos' ? sensores : sensores.filter((s) => s.tipo === filtro);

  return (
    <>
      <Header icon={<WifiIcon width={21} height={21} />} title="Sensores" subtitle="Leituras dos dispositivos de monitoramento" onOpenMenu={openMenu} />
      <div className="page-body">
        <div className="sensores-stats">
          <Card className="dash-stat">
            <span className="dash-stat-label"><WifiIcon width={16} height={16} /> Sensores</span>
            <strong>{sensores.length}</strong>
            <span className="dash-stat-sub">cadastrados</span>
          </Card>
          <Card className="dash-stat">
            <span className="dash-stat-label"><LeafIcon width={16} height={16} /> Online</span>
            <strong className="txt-ok">{online}</strong>
            <span className="dash-stat-sub"><span className="dot dot-on" /> enviando leituras</span>
          </Card>
          <Card className="dash-stat">
            <span className="dash-stat-label"><ClockIcon width={16} height={16} /> Offline</span>
            <strong>{sensores.length - online}</strong>
            <span className="dash-stat-sub"><span className="dot dot-off" /> sem comunicação</span>
          </Card>
          <Card className="dash-stat">
            <span className="dash-stat-label"><WaveIcon width={16} height={16} /> Reservatório</span>
            <strong>{nivel ? `${nivel.valor}%` : '--'}</strong>
            <span className="dash-stat-sub">nível da água</span>
          </Card>
        </div>

        <Card
          title="Sensores da horta"
          icon={<WifiIcon width={18} height={18} />}
          action={
            <div className="period-toggle">
              {TIPOS.map((t) => (
                <button key={t.value} className={`period-btn ${filtro === t.value ? 'period-btn-active' : ''}`} onClick={() => setFiltro(t.value)}>
                  {t.label}
                </button>
              ))}
            </div>
          }
        >
          {visiveis.length === 0 ? (
            <div className="empty-state">
              <WifiIcon width={30} height={30} />
              <strong>Nenhum sensor deste tipo</strong>
            </div>
          ) : (
            <div className="sensores-grid">
              {visiveis.map((s) => {
                const planta = s.tipo === 'umidade' ? plantas.find((x) => x.id === s.plantaId) : undefined;
                const condicao = planta ? ROTULO_CONDICAO[condicaoSolo(planta)] : '';
                return (
                <article key={s.id} className="sensor-item">
                  <header className="sensor-item-head">
                    <span className="sensor-item-icon"><IconeSensor tipo={s.tipo} /></span>
                    <div>
                      <strong>{s.nome}</strong>
                      <small>{ROTULO_TIPO[s.tipo]}</small>
                    </div>
                    <StatusBadge status={s.status === 'online' ? 'ideal' : 'critico'} label={s.status === 'online' ? 'Online' : 'Offline'} />
                  </header>
                  <div className="sensor-item-rows">
                    <div className="info-row">
                      <span>{ROTULO_VALOR[s.tipo]}</span>
                      <strong>{formatarValor(s)}{s.status === 'offline' ? ' (última leitura)' : ''}{condicao ? ` · ${condicao}` : ''}</strong>
                    </div>
                    {s.tipo === 'umidade' && s.calibracao && (
                      <>
                        <div className="info-row">
                          <span>Leitura bruta</span>
                          <strong>{s.bruto} / {RESOLUCAO[s.calibracao.placa]} ({s.calibracao.placa === 'esp32' ? 'ESP32' : 'Arduino'})</strong>
                        </div>
                        <div className="info-row">
                          <span>Instalação</span>
                          <strong>{s.profundidadeCm} cm{s.posicao ? ` · ${s.posicao}` : ''}</strong>
                        </div>
                      </>
                    )}
                    <div className="info-row">
                      <span>Última atualização</span>
                      <strong>{s.status === 'online' ? 'agora' : formatarRelativo(s.ultimaLeituraMs ?? agora, agora)}</strong>
                    </div>
                    <div className="info-row">
                      <span>Localização</span>
                      <strong>{s.localizacao}</strong>
                    </div>
                  </div>
                  {s.tipo === 'umidade' && s.status === 'online' && (
                    <div className="sensor-item-actions">
                      <Button type="button" variant="ghost" fullWidth aria-label={`Calibrar ${s.nome}`} onClick={() => setCalibrando(s.id)}>
                        Calibrar
                      </Button>
                    </div>
                  )}
                </article>
                );
              })}
            </div>
          )}
          {calibrando && sensores.find((x) => x.id === calibrando) && (
            <CalibracaoModal sensor={sensores.find((x) => x.id === calibrando)!} onClose={() => setCalibrando(null)} onSalvar={(cfg) => configurarSensor(calibrando, cfg)} />
          )}
          <small className="api-hint">Dados simulados: ainda não há dispositivos IoT (ESP32/Arduino) conectados.</small>
        </Card>
      </div>
    </>
  );
}
