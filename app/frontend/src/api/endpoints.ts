/** Caminhos da API (relativos a VITE_API_URL). Único lugar onde as URLs são definidas. */
export const ENDPOINTS = {
  plantas: '/plantas',
  sensores: '/sensores',
  calibracaoSensor: (sensorId: string) => `/sensores/${encodeURIComponent(sensorId)}/calibracao`,
  irrigacoes: '/irrigacoes',
  comandoIrrigacao: '/irrigacoes/comando',
  consumoAgua: '/consumo-agua',
  clima: '/clima',
  culturas: '/culturas',
} as const;
