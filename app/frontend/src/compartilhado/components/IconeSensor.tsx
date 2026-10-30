import type { SensorTipo } from '../types';
import { CloudIcon, DropletIcon, SunIcon, ThermometerIcon, WaveIcon } from './icons';

/** Ícone do tipo de sensor (Sensores na avançada e Dispositivos na intermediária). */
export default function IconeSensor({ tipo }: { tipo: SensorTipo }) {
  if (tipo === 'temperatura' || tipo === 'temperatura_folha') return <ThermometerIcon width={18} height={18} />;
  if (tipo === 'luminosidade') return <SunIcon width={18} height={18} />;
  if (tipo === 'nivel_agua') return <WaveIcon width={18} height={18} />;
  if (tipo === 'umidade_ar') return <CloudIcon width={18} height={18} />;
  return <DropletIcon width={18} height={18} />;
}
