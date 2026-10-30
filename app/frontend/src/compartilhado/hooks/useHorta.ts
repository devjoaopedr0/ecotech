import { useMemo } from 'react';
import { usePlants } from '../context/PlantsContext';
import { calcularIndicadores, diagnosticarPlanta, porUrgencia, situacaoDaHorta } from '../utils/horta';

/**
 * Indicadores da horta derivados do PlantsContext. Não guarda estado próprio.
 * É a fonte única das métricas compartilhadas pelas dashboards intermediária e avançada.
 */
export function useHorta() {
  const ctx = usePlants();
  const { plantas, sensores, leituras, culturas, alertas, agora } = ctx;

  const monitoradas = useMemo(
    () => plantas.map((p) => diagnosticarPlanta(p, sensores, leituras, culturas, agora)).sort(porUrgencia),
    [plantas, sensores, leituras, culturas, agora]
  );
  const indicadores = useMemo(() => calcularIndicadores(monitoradas, sensores, alertas), [monitoradas, sensores, alertas]);
  const situacao = useMemo(() => situacaoDaHorta(indicadores), [indicadores]);

  return { ...ctx, monitoradas, indicadores, situacao };
}
