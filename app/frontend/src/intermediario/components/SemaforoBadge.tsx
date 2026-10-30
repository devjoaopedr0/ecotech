import { CheckIcon, WarningIcon, WifiIcon } from '../../compartilhado/components/icons';
import { ROTULO_SEMAFORO, type NivelSemaforo } from '../regras/semaforo';

const CLASSE: Record<NivelSemaforo, string> = { adequado: 'status-ideal', atencao: 'status-atencao', critico: 'status-critico', sem_dados: 'status-semdados' };

/** Estado ambiental sempre com ícone E texto (a cor nunca comunica sozinha). */
export default function SemaforoBadge({ nivel, rotulo, contagem }: { nivel: NivelSemaforo; rotulo?: string; contagem?: number }) {
  const Icone = nivel === 'adequado' ? CheckIcon : nivel === 'sem_dados' ? WifiIcon : WarningIcon;
  return (
    <span className={`status-badge ${CLASSE[nivel]}`}>
      <Icone width={13} height={13} aria-hidden="true" />
      {contagem !== undefined && <strong>{contagem}</strong>} {rotulo ?? ROTULO_SEMAFORO[nivel]}
    </span>
  );
}
