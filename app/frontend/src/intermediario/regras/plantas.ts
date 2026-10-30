import type { Alerta } from '../../compartilhado/types';
import { alertaRequerAcao, type PlantaMonitorada } from '../../compartilhado/utils/horta';
import { precisaAtencao } from './semaforo';

export type FiltroPlantas = 'todas' | 'atencao' | 'alertas' | 'sem_dados';

export const FILTROS_VALIDOS: FiltroPlantas[] = ['todas', 'atencao', 'alertas', 'sem_dados'];
export const ehFiltro = (v: unknown): v is FiltroPlantas => FILTROS_VALIDOS.includes(v as FiltroPlantas);

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Ids das plantas com alerta ativo (alertas informativos, como "irrigação iniciada", não contam). */
export const plantasComAlerta = (alertas: Alerta[]): Set<string> =>
  new Set(alertas.filter((a) => alertaRequerAcao(a) && a.plantaId).map((a) => a.plantaId as string));

export function filtrarPlantas(lista: PlantaMonitorada[], busca: string, filtro: FiltroPlantas, comAlerta: Set<string>): PlantaMonitorada[] {
  const termo = normalizar(busca);
  return lista.filter((m) => {
    if (termo && !normalizar(`${m.planta.nome} ${m.planta.canteiro} ${m.planta.tipo}`).includes(termo)) return false;
    if (filtro === 'atencao') return precisaAtencao(m);
    if (filtro === 'alertas') return comAlerta.has(m.planta.id);
    if (filtro === 'sem_dados') return m.estado === 'sem_dados';
    return true;
  });
}
