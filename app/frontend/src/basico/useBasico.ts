import { useMemo } from 'react';
import { useHorta } from '../compartilhado/hooks/useHorta';
import { resumoBasico, tarefasDoDia } from './regras/simples';

/** Dados derivados da básica (tarefas e resumo em linguagem simples), calculados uma vez a partir do useHorta. */
export function useBasico() {
  const horta = useHorta();
  const { monitoradas, sensores, sessaoDa } = horta;

  // sessaoDa muda de identidade a cada atualização do contexto, então depende do que ele lê.
  const tarefas = useMemo(() => tarefasDoDia(monitoradas, sensores, (id) => sessaoDa(id).estado === 'ligada'), [monitoradas, sensores, sessaoDa]);
  const resumo = useMemo(() => resumoBasico(monitoradas.length, tarefas), [monitoradas.length, tarefas]);

  return { ...horta, tarefas, resumo };
}
