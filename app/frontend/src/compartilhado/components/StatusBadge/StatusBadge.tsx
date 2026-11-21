import type { ReactNode } from 'react';
import type { PlantStatus } from '../../types';
import { AlertOctagonIcon, CheckCircleIcon, InfoIcon, WarningIcon, WifiOffIcon } from '../icons';
import './StatusBadge.css';

/** Linguagem visual única de status. Além da cor, cada estado tem forma de ícone e texto próprios. */
export type StatusVisual = PlantStatus | 'offline' | 'info';

const CONFIG: Record<StatusVisual, { label: string; className: string; icon: ReactNode }> = {
  ideal: { label: 'Normal', className: 'status-ideal', icon: <CheckCircleIcon width={13} height={13} aria-hidden="true" /> },
  atencao: { label: 'Atenção', className: 'status-atencao', icon: <WarningIcon width={13} height={13} aria-hidden="true" /> },
  abaixo: { label: 'Abaixo', className: 'status-abaixo', icon: <WarningIcon width={13} height={13} aria-hidden="true" /> },
  critico: { label: 'Crítico', className: 'status-critico', icon: <AlertOctagonIcon width={13} height={13} aria-hidden="true" /> },
  offline: { label: 'Offline', className: 'status-offline', icon: <WifiOffIcon width={13} height={13} aria-hidden="true" /> },
  info: { label: 'Informativo', className: 'status-info', icon: <InfoIcon width={13} height={13} aria-hidden="true" /> },
};

export default function StatusBadge({ status, label }: { status: StatusVisual; label?: string }) {
  const c = CONFIG[status];
  return (
    <span className={`status-badge ${c.className}`}>
      {c.icon}
      {label ?? c.label}
    </span>
  );
}
