import type { ReactNode } from 'react';
import type { Plant } from '../../types';
import Card from '../Card';
import { DropletIcon, LeafIcon } from '../icons';
import './PlantaResumo.css';

/** Item da coluna lateral do resumo (rótulo pequeno + valor). */
export function PlantaResumoItem({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="monitor-plant-side-item">
      <span>{rotulo}</span>
      {children}
    </div>
  );
}

interface Props {
  planta: Plant;
  /** Umidade a exibir; null quando não há leitura confiável (mostra "—" e barra vazia). */
  umidade: number | null;
  /** Itens laterais (faixa ideal, umidade crítica, status…). */
  children: ReactNode;
}

/** Cartão-resumo da planta usado no Monitor (avançada) e no Monitoramento (intermediária). */
export default function PlantaResumo({ planta, umidade, children }: Props) {
  return (
    <Card className="monitor-plant-card">
      <div className="monitor-plant-ring">
        <span style={{ fontSize: 40 }}>{planta.emoji}</span>
      </div>
      <div className="monitor-plant-info">
        <h3>
          <LeafIcon width={17} height={17} /> {planta.nome}
        </h3>
        <span className="monitor-plant-local">{planta.local}</span>
        <div className="monitor-plant-metric">
          <span>
            <DropletIcon width={15} height={15} /> Umidade atual
          </span>
          <strong>{umidade === null ? '—' : `${umidade}%`}</strong>
          <div className="monitor-bar">
            <div className="monitor-bar-fill" style={{ width: `${umidade ?? 0}%` }} />
          </div>
        </div>
      </div>
      <div className="monitor-plant-side">{children}</div>
    </Card>
  );
}
