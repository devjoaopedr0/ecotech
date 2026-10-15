import type { PlantStatus } from '../../types';
import { CheckIcon, WarningIcon } from '../icons';
import './StatusBadge.css';

const CONFIG: Record<PlantStatus, { label: string; className: string; icon: React.ReactNode }> = {
  ideal: { label: 'Ideal', className: 'status-ideal', icon: <CheckIcon width={13} height={13} /> },
  atencao: { label: 'Atenção', className: 'status-atencao', icon: <WarningIcon width={13} height={13} /> },
  abaixo: { label: 'Abaixo', className: 'status-abaixo', icon: <WarningIcon width={13} height={13} /> },
};

export default function StatusBadge({ status }: { status: PlantStatus }) {
  const c = CONFIG[status];
  return (
    <span className={`status-badge ${c.className}`}>
      {c.icon}
      {c.label}
    </span>
  );
}
