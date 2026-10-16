import { useState } from 'react';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import type { Calibracao, PlacaSensor, Sensor } from '../../types';
import { brutoParaPercentual, CALIBRACAO_PADRAO, RESOLUCAO, ROTULO_PLACA, validarCalibracao } from '../../utils/calibracao';
import type { SensorCfg } from '../../context/PlantsContext';

const PLACAS: PlacaSensor[] = ['esp32', 'arduino'];

/** Calibra o sensor: converte a leitura bruta do ADC (seco = 0%, molhado = 100%) e registra a posição de instalação. */
export default function CalibracaoModal({ sensor, onClose, onSalvar }: { sensor: Sensor; onClose: () => void; onSalvar: (cfg: SensorCfg) => void }) {
  const [cal, setCal] = useState<Calibracao>(sensor.calibracao ?? CALIBRACAO_PADRAO.esp32);
  const [profundidade, setProfundidade] = useState(sensor.profundidadeCm ?? 10);
  const [posicao, setPosicao] = useState(sensor.posicao ?? '');
  const [erro, setErro] = useState('');

  const trocarPlaca = (placa: PlacaSensor) => setCal(CALIBRACAO_PADRAO[placa]);
  const bruto = sensor.bruto ?? 0;
  const previa = brutoParaPercentual(bruto, cal);

  const salvar = () => {
    const e = validarCalibracao(cal, profundidade);
    if (e) return setErro(e);
    onSalvar({ calibracao: cal, profundidadeCm: profundidade, posicao: posicao.trim() || undefined });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={`Calibrar ${sensor.nome}`} width={480}>
      <div className="edit-plant-form">
        <div className="range-fields">
          <span className="range-label">Placa</span>
          <div className="period-toggle">
            {PLACAS.map((p) => (
              <button key={p} type="button" className={`period-btn ${cal.placa === p ? 'period-btn-active' : ''}`} onClick={() => trocarPlaca(p)}>
                {ROTULO_PLACA[p]}
              </button>
            ))}
          </div>
        </div>
        <div className="range-fields">
          <span className="range-label">Leitura bruta: sensor no ar (seco, 0%) / na água (molhado, 100%)</span>
          <div className="range-inputs">
            <input type="number" min={0} max={RESOLUCAO[cal.placa]} aria-label="Valor bruto seco" value={cal.brutoSeco} onChange={(e) => setCal((c) => ({ ...c, brutoSeco: Number(e.target.value) }))} />
            <span>/</span>
            <input type="number" min={0} max={RESOLUCAO[cal.placa]} aria-label="Valor bruto molhado" value={cal.brutoMolhado} onChange={(e) => setCal((c) => ({ ...c, brutoMolhado: Number(e.target.value) }))} />
          </div>
        </div>
        <div className="range-fields">
          <span className="range-label">Profundidade (cm) e posição</span>
          <div className="range-inputs">
            <input type="number" min={1} aria-label="Profundidade" value={profundidade} onChange={(e) => setProfundidade(Number(e.target.value))} />
            <input type="text" aria-label="Posição" placeholder="Ex.: próximo à raiz" value={posicao} onChange={(e) => setPosicao(e.target.value)} />
          </div>
        </div>
        <p className="calib-preview">
          Leitura atual <strong>{bruto}</strong> (de {RESOLUCAO[cal.placa]}) → <strong>{previa}%</strong>
        </p>
        {erro && <p className="login-error">{erro}</p>}
        <div className="edit-form-actions">
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>Cancelar</Button>
          <Button type="button" variant="primary" fullWidth onClick={salvar}>Salvar calibração</Button>
        </div>
      </div>
    </Modal>
  );
}
