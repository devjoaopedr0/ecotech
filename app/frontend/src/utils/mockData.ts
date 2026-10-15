import type { Plant, LeituraRecente, RelatorioIrrigacao, HistoricoPonto } from '../types';

export const plantasIniciais: Plant[] = [
  { id: '1', nome: 'Alface', tipo: 'Hortaliça', emoji: '🥬', umidadeAtual: 62, faixaMin: 50, faixaMax: 70, local: 'Horta Principal', dataCadastro: '08/09/2025', ultimaIrrigacao: '08/09/2025 às 07:42' },
  { id: '2', nome: 'Manjericão', tipo: 'Erva aromática', emoji: '🌿', umidadeAtual: 48, faixaMin: 40, faixaMax: 60, local: 'Horta Principal', dataCadastro: '08/09/2025', ultimaIrrigacao: '08/09/2025 às 06:28' },
  { id: '3', nome: 'Cebolinha', tipo: 'Hortaliça', emoji: '🌱', umidadeAtual: 71, faixaMin: 50, faixaMax: 70, local: 'Horta Principal', dataCadastro: '08/09/2025', ultimaIrrigacao: '08/09/2025 às 05:17' },
  { id: '4', nome: 'Sálvia', tipo: 'Erva aromática', emoji: '🌿', umidadeAtual: 39, faixaMin: 40, faixaMax: 60, local: 'Horta Principal', dataCadastro: '08/09/2025', ultimaIrrigacao: '08/09/2025 às 04:03' },
  { id: '5', nome: 'Tomate', tipo: 'Hortaliça', emoji: '🍅', umidadeAtual: 66, faixaMin: 50, faixaMax: 70, local: 'Horta Principal', dataCadastro: '08/09/2025', ultimaIrrigacao: '08/09/2025 às 02:11' },
  { id: '6', nome: 'Hortelã', tipo: 'Erva aromática', emoji: '🌿', umidadeAtual: 54, faixaMin: 40, faixaMax: 60, local: 'Horta Principal', dataCadastro: '08/09/2025', ultimaIrrigacao: '07/09/2025 às 22:10' },
  { id: '7', nome: 'Rúcula', tipo: 'Hortaliça', emoji: '🌱', umidadeAtual: 43, faixaMin: 40, faixaMax: 60, local: 'Horta Principal', dataCadastro: '08/09/2025', ultimaIrrigacao: '07/09/2025 às 20:45' },
  { id: '8', nome: 'Coentro', tipo: 'Erva aromática', emoji: '🌿', umidadeAtual: 58, faixaMin: 50, faixaMax: 70, local: 'Horta Principal', dataCadastro: '08/09/2025', ultimaIrrigacao: '07/09/2025 às 19:30' },
];

export const leiturasRecentes: LeituraRecente[] = [
  { id: '1', plantaNome: 'Alface', umidade: 62, status: 'ideal', horario: '08:42' },
  { id: '2', plantaNome: 'Manjericão', umidade: 48, status: 'atencao', horario: '08:37' },
  { id: '3', plantaNome: 'Cebolinha', umidade: 71, status: 'ideal', horario: '08:31' },
  { id: '4', plantaNome: 'Sálvia', umidade: 39, status: 'abaixo', horario: '08:26' },
  { id: '5', plantaNome: 'Tomate', umidade: 66, status: 'ideal', horario: '08:20' },
];

export const relatorioIrrigacao: RelatorioIrrigacao[] = [
  { id: '1', plantaNome: 'Alface', data: '08/09/2025', hora: '07:42' },
  { id: '2', plantaNome: 'Manjericão', data: '08/09/2025', hora: '06:28' },
  { id: '3', plantaNome: 'Cebolinha', data: '08/09/2025', hora: '05:17' },
  { id: '4', plantaNome: 'Sálvia', data: '08/09/2025', hora: '04:03' },
  { id: '5', plantaNome: 'Tomate', data: '08/09/2025', hora: '02:11' },
];

function gerarHistorico(pontos: number, base: number, amplitude: number, labelFn: (i: number) => string): HistoricoPonto[] {
  const out: HistoricoPonto[] = [];
  for (let i = 0; i < pontos; i++) {
    const val = Math.round(base + Math.sin(i / 2) * amplitude + (Math.random() - 0.5) * 4);
    out.push({ hora: labelFn(i), umidade: Math.max(0, Math.min(100, val)) });
  }
  return out;
}

export const historicoPorPeriodo: Record<string, HistoricoPonto[]> = {
  '6h': gerarHistorico(7, 58, 8, (i) => `${String(i).padStart(2, '0')}:00`),
  '12h': gerarHistorico(7, 55, 10, (i) => `${String(i * 2).padStart(2, '0')}:00`),
  '24h': gerarHistorico(9, 55, 12, (i) => `${String(i * 3).padStart(2, '0')}:00`),
  '7d': gerarHistorico(7, 55, 10, (i) => `Dia ${i + 1}`),
};

export const umidadeSemanal: HistoricoPonto[] = [
  { hora: '02/09', umidade: 48 },
  { hora: '03/09', umidade: 60 },
  { hora: '04/09', umidade: 58 },
  { hora: '05/09', umidade: 50 },
  { hora: '06/09', umidade: 68 },
  { hora: '07/09', umidade: 55 },
  { hora: '08/09', umidade: 64 },
];
