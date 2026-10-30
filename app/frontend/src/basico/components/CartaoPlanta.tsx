import type { PlantaMonitorada } from '../../compartilhado/utils/horta';
import { estadoSimples } from '../regras/simples';
import BotaoRegar from './BotaoRegar';

/** Uma planta: nome, estado em palavras, a umidade como barra e o botão de regar. */
export default function CartaoPlanta({ monitorada }: { monitorada: PlantaMonitorada }) {
  const { planta } = monitorada;
  const e = estadoSimples(monitorada);
  const semInfo = e.estado === 'sem_info';

  return (
    <article className={`basico-planta basico-planta-${e.estado}`}>
      <header>
        <span className="basico-planta-emoji" aria-hidden="true">{planta.emoji}</span>
        <div>
          <h3>{planta.nome}</h3>
          <span className="basico-planta-estado">{e.rotulo}</span>
        </div>
      </header>
      <p>{e.frase}</p>
      <div className="basico-agua" aria-label={semInfo ? 'Água na terra: sem informação' : `Água na terra: ${planta.umidadeAtual}%`}>
        <span>Água na terra</span>
        <div className="basico-agua-barra">
          <div style={{ width: `${semInfo ? 0 : Math.min(100, Math.max(0, planta.umidadeAtual))}%` }} />
        </div>
        <strong>{semInfo ? '—' : `${planta.umidadeAtual}%`}</strong>
      </div>
      <BotaoRegar plantaId={planta.id} />
    </article>
  );
}
