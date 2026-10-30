import type { Alerta, LeituraColetada, Plant, PlantStatus, RegistroIrrigacao } from '../../compartilhado/types';
import { statusDaPlanta } from '../../compartilhado/utils/umidade';
import { formatarLitros } from '../../compartilhado/utils/format';

export type TipoAtividade = 'umidade' | 'irrigacao_inicio' | 'irrigacao_fim';

export interface Atividade {
  id: string;
  ts: number;
  tipo: TipoAtividade;
  titulo: string;
  detalhe: string;
  severidade: PlantStatus;
  plantaId?: string;
}

/**
 * Atividades recentes a partir de registros que têm horário:
 *  - irrigações iniciadas (eventos do sistema) e concluídas (histórico de irrigação, com duração e umidade antes/depois);
 *  - mudanças de estado da umidade, detectadas nas leituras de rotina de cada planta (comparadas aos limites ATUAIS da planta).
 * Não há registro de recuperação de sensores nem de mudanças de estado de sensores; esses eventos não são inventados.
 */
export function atividadesRecentes(plantas: Plant[], leituras: LeituraColetada[], historico: RegistroIrrigacao[], alertas: Alerta[]): Atividade[] {
  const out: Atividade[] = [];

  for (const a of alertas) {
    if (a.tipo !== 'irrigacao_iniciada' || a.criadoEm <= 0) continue;
    out.push({ id: a.id, ts: a.criadoEm, tipo: 'irrigacao_inicio', titulo: a.titulo, detalhe: a.mensagem, severidade: 'ideal', plantaId: a.plantaId });
  }

  for (const r of historico) {
    out.push({
      id: r.id,
      ts: r.timestamp,
      tipo: 'irrigacao_fim',
      titulo: 'Irrigação concluída',
      detalhe: `${r.plantaNome} (${r.canteiro}): ${r.duracaoMin} min, ${formatarLitros(r.litros)}. Umidade de ${r.umidadeAntes}% para ${r.umidadeDepois}%.`,
      severidade: 'ideal',
      plantaId: r.plantaId,
    });
  }

  for (const p of plantas) {
    const rotina = leituras.filter((l) => l.plantaId === p.id && l.fase === 'rotina').sort((a, b) => a.ts - b.ts);
    for (let i = 1; i < rotina.length; i++) {
      const antes = statusDaPlanta({ ...p, umidadeAtual: rotina[i - 1].umidade });
      const l = rotina[i];
      const depois = statusDaPlanta({ ...p, umidadeAtual: l.umidade });
      if (antes === depois) continue;
      const faixa = depois === 'critico' ? `abaixo do limite crítico (${p.umidadeCritica}%)` : l.umidade < p.umidadeMinima ? `abaixo do mínimo (${p.umidadeMinima}%)` : `acima do máximo (${p.umidadeMaxima}%)`;
      out.push({
        id: `umidade-${p.id}-${l.ts}`,
        ts: l.ts,
        tipo: 'umidade',
        titulo: depois === 'ideal' ? 'Umidade voltou ao normal' : depois === 'critico' ? 'Umidade ficou crítica' : 'Umidade saiu da faixa',
        detalhe: depois === 'ideal' ? `${p.nome}: ${l.umidade}%, dentro dos limites (${p.umidadeMinima}–${p.umidadeMaxima}%).` : `${p.nome}: ${l.umidade}%, ${faixa}.`,
        severidade: depois,
        plantaId: p.id,
      });
    }
  }

  return out.sort((a, b) => b.ts - a.ts);
}
