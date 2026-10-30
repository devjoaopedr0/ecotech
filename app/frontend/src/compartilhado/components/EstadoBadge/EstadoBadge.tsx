import { CheckIcon, WarningIcon, WifiIcon } from '../icons';
import { ROTULO_ESTADO, type EstadoPlanta } from '../../utils/horta';

const CLASSE_ESTADO: Record<EstadoPlanta, string> = { saudavel: 'status-ideal', atencao: 'status-atencao', critico: 'status-critico', sem_dados: 'status-semdados' };

/** Estado da planta sempre com ícone e texto (nunca só cor). Mesmo visual do StatusBadge compartilhado. */
export default function EstadoBadge({ estado }: { estado: EstadoPlanta }) {
  const Icone = estado === 'saudavel' ? CheckIcon : estado === 'sem_dados' ? WifiIcon : WarningIcon;
  return (
    <span className={`status-badge ${CLASSE_ESTADO[estado]}`}>
      <Icone width={13} height={13} aria-hidden="true" />
      {ROTULO_ESTADO[estado]}
    </span>
  );
}
