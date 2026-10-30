import { apiBaseUrl } from './client';
import { httpEcotechApi } from './ecotechApi.http';
import { mockEcotechApi } from './ecotechApi.mock';
import type { EcotechApi } from './types';

export type { AjustesSensor, DadosHorta, DadosPlanta, EcotechApi, PreferenciasNotificacao, Usuario } from './types';
export { ENDPOINTS } from './endpoints';
export { ApiError } from './client';
export { aoExpirarSessao } from './session';

/** API usada pelo app: HTTP quando VITE_API_URL está definido; caso contrário, dados simulados. */
export const ecotechApi: EcotechApi = apiBaseUrl() ? httpEcotechApi : mockEcotechApi;
