/** Caminhos da API (relativos a VITE_API_URL). Único lugar onde as URLs são definidas. */
const id = (valor: string) => encodeURIComponent(valor);

export const ENDPOINTS = {
  login: '/auth/login',
  refresh: '/auth/refresh',
  me: '/auth/me',
  senha: '/auth/password',
  notificacoes: '/users/me/notifications',

  plantas: '/plants',
  planta: (plantaId: string) => `/plants/${id(plantaId)}`,
  irrigacao: (plantaId: string) => `/plants/${id(plantaId)}/irrigation`,
  irrigacoes: '/irrigation/events',

  culturas: '/crops',
  cultura: (culturaId: string) => `/crops/${id(culturaId)}`,

  dispositivos: '/devices',
  dispositivo: (dispositivoId: string) => `/devices/${id(dispositivoId)}`,
  calibracao: (dispositivoId: string) => `/devices/${id(dispositivoId)}/calibration`,

  leituras: '/readings',
  consumoAgua: '/reports/water',
  alertas: '/alerts',
} as const;
