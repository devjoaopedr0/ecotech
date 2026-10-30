import { useMemo } from 'react';
import { useHorta } from '../compartilhado/hooks/useHorta';
import { atividadesRecentes } from './regras/atividades';
import { montarCentralAtencao } from './regras/central';
import { plantasComAlerta } from './regras/plantas';
import { gerarRecomendacoes } from './regras/recomendacoes';
import { contarSemaforo } from './regras/semaforo';

/** Dados derivados da intermediária (central, recomendações, atividades), calculados uma vez a partir do useHorta. */
export function useIntermediario() {
  const horta = useHorta();
  const { alertas, plantas, sensores, comandosIrrigacao, monitoradas, sessaoDa, leituras, agora, historicoIrrigacao } = horta;

  const central = useMemo(() => montarCentralAtencao(alertas, plantas, sensores, comandosIrrigacao), [alertas, plantas, sensores, comandosIrrigacao]);
  // sessaoDa muda de identidade a cada atualização do contexto, então depende do que ele lê.
  const recomendacoes = useMemo(() => gerarRecomendacoes(monitoradas, sessaoDa, leituras, agora), [monitoradas, sessaoDa, leituras, agora]);
  const atividades = useMemo(() => atividadesRecentes(plantas, leituras, historicoIrrigacao, alertas), [plantas, leituras, historicoIrrigacao, alertas]);
  const comAlerta = useMemo(() => plantasComAlerta(alertas), [alertas]);
  const semaforo = useMemo(() => contarSemaforo(monitoradas), [monitoradas]);

  return { ...horta, central, recomendacoes, atividades, comAlerta, semaforo };
}
