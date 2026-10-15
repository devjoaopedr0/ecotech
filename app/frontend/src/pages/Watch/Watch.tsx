import { useNavigate } from 'react-router-dom';
import { DropletIcon, PlayIcon, StopIcon, AutoIcon } from '../../components/icons';
import { useAuth } from '../../context/AuthContext';
import { usePlants } from '../../context/PlantsContext';
import './Watch.css';

export default function Watch() {
  const {
    irrigacaoEstado,
    irrigacaoModo,
    ligarIrrigacao,
    desligarIrrigacao,
    setModoAutomatico,
    setModoManual,
  } = usePlants();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const ligada = irrigacaoEstado === 'ligada';
  const automatico = irrigacaoModo === 'automatico';

  const sair = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="watch-page">
      <div className="watch-status">
        <DropletIcon width={16} height={16} />
        <span>Irrigação</span>
        <strong className={ligada ? 'txt-ok' : ''}>
          <span className={`dot ${ligada ? 'dot-on' : 'dot-off'}`} />
          {ligada ? 'Ligada' : 'Desligada'}
        </strong>
      </div>

      <div className="watch-row">
        <button
          className={`watch-btn watch-btn-on ${ligada ? 'watch-btn-active' : ''}`}
          onClick={ligarIrrigacao}
          aria-pressed={ligada}
        >
          <PlayIcon width={18} height={18} />
          Ligar
        </button>
        <button
          className={`watch-btn watch-btn-off ${!ligada ? 'watch-btn-active' : ''}`}
          onClick={desligarIrrigacao}
          aria-pressed={!ligada}
        >
          <StopIcon width={18} height={18} />
          Desligar
        </button>
      </div>

      <button
        className={`watch-btn watch-btn-auto ${automatico ? 'watch-btn-active' : ''}`}
        onClick={automatico ? setModoManual : setModoAutomatico}
        aria-pressed={automatico}
      >
        <AutoIcon width={18} height={18} />
        Automático
      </button>

      <button className="watch-logout" onClick={sair}>
        Sair
      </button>
    </div>
  );
}
