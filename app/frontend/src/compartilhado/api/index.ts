import { apiBaseUrl } from './client';
import { httpEcotechApi } from './ecotechApi.http.ts';
import { mockEcotechApi } from './ecotechApi.mock.ts';
import type { EcotechApi } from './types';

export type { ComandoIrrigacao, EcotechApi } from './types';
export { ENDPOINTS } from './endpoints';
export { ApiError } from './client';

/** API usada pelo app: HTTP quando VITE_API_URL está definido; caso contrário, dados simulados. */
export const ecotechApi: EcotechApi = apiBaseUrl() ? httpEcotechApi : mockEcotechApi;
