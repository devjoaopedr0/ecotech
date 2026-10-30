import type { PlantStatus } from '../../types';
import { CheckIcon, WarningIcon } from '../icons';
import './StatusBadge.css';

const CONFIG: Record<PlantStatus, { label: string; className: string; icon: React.ReactNode }> = {
  ideal: { label: 'Normal', className: 'status-ideal', icon: <CheckIcon width={13} height={13} /> },
  atencao: { label: 'Atenção', className: 'status-atencao', icon: <WarningIcon width={13} height={13} /> },
  abaixo: { label: 'Abaixo', className: 'status-abaixo', icon: <WarningIcon width={13} height={13} /> },
  critico: { label: 'Crítico', className: 'status-critico', icon: <WarningIcon width={13} height={13} /> },
};

export default function StatusBadge({ status, label }: { status: PlantStatus; label?: string }) {
  const c = CONFIG[status];
  return (
    <span className={`status-badge ${c.className}`}>
      {c.icon}
      {label ?? c.label}
    </span>
  );
}
