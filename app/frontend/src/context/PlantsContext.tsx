import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Plant, IrrigacaoEstado, IrrigacaoModo } from '../types';
import { plantasIniciais } from '../utils/mockData';

export function statusDaPlanta(p: Plant): 'ideal' | 'atencao' | 'abaixo' {
  if (p.umidadeAtual < p.faixaMin) return 'abaixo';
  if (p.umidadeAtual > p.faixaMax) return 'atencao';
  const margem = (p.faixaMax - p.faixaMin) * 0.15;
  if (p.umidadeAtual < p.faixaMin + margem) return 'atencao';
  return 'ideal';
}

interface PlantsContextValue {
  plantas: Plant[];
  atualizarPlanta: (id: string, dados: Partial<Plant>) => void;
  removerPlanta: (id: string) => void;
  adicionarPlanta: (dados: Omit<Plant, 'id' | 'dataCadastro' | 'ultimaIrrigacao'>) => void;
  plantaSelecionadaId: string;
  setPlantaSelecionadaId: (id: string) => void;
  irrigacaoEstado: IrrigacaoEstado;
  irrigacaoModo: IrrigacaoModo;
  ligarIrrigacao: () => void;
  desligarIrrigacao: () => void;
  setModoAutomatico: () => void;
  setModoManual: () => void;
}

const PlantsContext = createContext<PlantsContextValue | undefined>(undefined);

export function PlantsProvider({ children }: { children: ReactNode }) {
  const [plantas, setPlantas] = useState<Plant[]>(plantasIniciais);
  const [plantaSelecionadaId, setPlantaSelecionadaId] = useState<string>(plantasIniciais[0].id);
  const [irrigacaoEstado, setIrrigacaoEstado] = useState<IrrigacaoEstado>('desligada');
  const [irrigacaoModo, setIrrigacaoModo] = useState<IrrigacaoModo>('automatico');

  const atualizarPlanta = (id: string, dados: Partial<Plant>) => {
    setPlantas((prev) => prev.map((p) => (p.id === id ? { ...p, ...dados } : p)));
  };

  const removerPlanta = (id: string) => {
    setPlantas((prev) => prev.filter((p) => p.id !== id));
  };

  const adicionarPlanta: PlantsContextValue['adicionarPlanta'] = (dados) => {
    const nova: Plant = {
      ...dados,
      id: crypto.randomUUID(),
      dataCadastro: new Date().toLocaleDateString('pt-BR'),
      ultimaIrrigacao: '--',
    };
    setPlantas((prev) => [...prev, nova]);
  };

  const ligarIrrigacao = () => setIrrigacaoEstado('ligada');
  const desligarIrrigacao = () => setIrrigacaoEstado('desligada');
  const setModoAutomatico = () => setIrrigacaoModo('automatico');
  const setModoManual = () => setIrrigacaoModo('manual');

  const value = useMemo(
    () => ({
      plantas,
      atualizarPlanta,
      removerPlanta,
      adicionarPlanta,
      plantaSelecionadaId,
      setPlantaSelecionadaId,
      irrigacaoEstado,
      irrigacaoModo,
      ligarIrrigacao,
      desligarIrrigacao,
      setModoAutomatico,
      setModoManual,
    }),
    [plantas, plantaSelecionadaId, irrigacaoEstado, irrigacaoModo]
  );

  return <PlantsContext.Provider value={value}>{children}</PlantsContext.Provider>;
}

export function usePlants() {
  const ctx = useContext(PlantsContext);
  if (!ctx) throw new Error('usePlants deve ser usado dentro de PlantsProvider');
  return ctx;
}
