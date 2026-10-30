import type { LeituraColetada, PlantStatus, SessaoIrrigacao } from '../../compartilhado/types';
import { tendenciaDaPlanta, type PlantaMonitorada } from '../../compartilhado/utils/horta';
import { formatarNumero } from './formato';

/**
 * Recomendações da intermediária: regras determinísticas e transparentes sobre dados medidos.
 * Não há modelo de IA e não usam a previsão do tempo (hoje fixa/simulada, sem integração).
 * Cada item informa o que foi identificado, por que importa e o que fazer. Condições que já geram alerta
 * (umidade fora do limite, sensor offline, leitura inválida...) ficam na Central de atenção, sem repetição aqui.
 */
export interface Recomendacao {
  id: string;
  severidade: PlantStatus;
  /** O que foi identificado. */
  titulo: string;
  /** Por que merece atenção, com os números que sustentam a conclusão. */
  porQue: string;
  /** Ação recomendada. */
  acao: string;
  plantaId?: string;
  dispositivo?: string;
  /** Onde a ação é feita no sistema. */
  destino: 'planta' | 'irrigacao';
}

/** Variação (p.p.) entre a primeira e a última leitura da janela a partir da qual a mudança é considerada relevante. */
export const LIMIAR_MUDANCA_RELEVANTE = 15;
/** Só vale avisar de queda quando o limite crítico é estimado para as próximas horas. */
export const HORIZONTE_QUEDA_H = 6;

const ORDEM: Record<PlantStatus, number> = { critico: 0, abaixo: 1, atencao: 2, ideal: 3 };

export function gerarRecomendacoes(
  monitoradas: PlantaMonitorada[],
  sessaoDa: (plantaId: string) => SessaoIrrigacao,
  leituras: LeituraColetada[],
  agora: number
): Recomendacao[] {
  const out: Recomendacao[] = [];

  for (const m of monitoradas) {
    const { planta, sensor } = m;
    const sessao = sessaoDa(planta.id);
    const irrigando = sessao.estado === 'ligada';

    // 1. Sem sensor: a planta não é monitorada e não gera alerta de umidade.
    if (!sensor) {
      out.push({
        id: `sem-sensor-${planta.id}`,
        severidade: 'atencao',
        titulo: `${planta.nome} não tem sensor de umidade`,
        porQue: 'Sem sensor, a planta não é monitorada e nenhum alerta de umidade pode ser gerado para ela.',
        acao: 'Instale e associe um sensor de umidade a esta planta.',
        plantaId: planta.id,
        destino: 'planta',
      });
      continue;
    }
    if (m.estado === 'sem_dados') continue; // sem leitura confiável: o alerta do sensor já orienta a conferência

    // 2. Temperatura fora da faixa da cultura (não gera alerta).
    if (m.avisoTemperatura) {
      out.push({
        id: `temperatura-${planta.id}`,
        severidade: 'atencao',
        titulo: `Condição ambiental fora da faixa para ${planta.nome}`,
        porQue: m.avisoTemperatura,
        acao: 'Verifique ventilação e sombreamento do canteiro e acompanhe a temperatura.',
        plantaId: planta.id,
        destino: 'planta',
      });
    }

    // 3. Modo manual e solo precisando de água: a irrigação não começa sozinha.
    const precisaAgua = m.estado === 'critico' || planta.umidadeAtual < planta.umidadeMinima;
    if (precisaAgua && sessao.modo === 'manual' && !irrigando) {
      out.push({
        id: `irrigar-manual-${planta.id}`,
        severidade: m.estado === 'critico' ? 'critico' : 'atencao',
        titulo: `Avaliar a necessidade de irrigação em ${planta.nome}`,
        porQue: `${m.motivo} A irrigação está em modo manual, então não começa sozinha.`,
        acao: 'Se o reservatório tiver água, inicie a irrigação na página Irrigação.',
        plantaId: planta.id,
        dispositivo: sensor.nome,
        destino: 'irrigacao',
      });
      continue;
    }

    // 4. Tendência medida e mudança relevante (só com leituras suficientes; ver tendenciaDaPlanta).
    const t = tendenciaDaPlanta(planta, leituras, agora);
    const janela = `${formatarNumero(t.janelaHoras)} h`;
    if (t.direcao === 'queda' && t.horasAteCritico !== null && t.horasAteCritico <= HORIZONTE_QUEDA_H && !irrigando && !precisaAgua) {
      out.push({
        id: `queda-${planta.id}`,
        severidade: 'atencao',
        titulo: `Umidade de ${planta.nome} em queda`,
        porQue: `A umidade cai cerca de ${formatarNumero(Math.abs(t.taxaPorHora ?? 0))} p.p. por hora (${t.leituras} leituras em ${janela}). Nesse ritmo chegaria ao limite crítico (${planta.umidadeCritica}%) em cerca de ${formatarNumero(t.horasAteCritico)} h. É uma estimativa: não considera chuva nem irrigação.`,
        acao: sessao.modo === 'manual' ? 'Verifique o canteiro e avalie irrigar antes do limite crítico: em modo manual, a irrigação não inicia sozinha.' : 'Acompanhe: no modo automático, a irrigação inicia sozinha ao atingir o limite crítico.',
        plantaId: planta.id,
        destino: sessao.modo === 'manual' ? 'irrigacao' : 'planta',
      });
    } else if (t.variacao !== null && t.leituras >= 4 && Math.abs(t.variacao) >= LIMIAR_MUDANCA_RELEVANTE) {
      out.push({
        id: `mudanca-${planta.id}`,
        severidade: t.variacao < 0 ? 'atencao' : 'ideal',
        titulo: `Umidade de ${planta.nome} mudou bastante`,
        porQue: `Entre a primeira e a última leitura das últimas ${janela}, a umidade ${t.variacao < 0 ? 'caiu' : 'subiu'} ${formatarNumero(Math.abs(t.variacao))} p.p. (${t.leituras} leituras).`,
        acao: 'Consulte os dados da planta e confirme se a mudança era esperada.',
        plantaId: planta.id,
        destino: 'planta',
      });
    }
  }

  return out.sort((a, b) => ORDEM[a.severidade] - ORDEM[b.severidade]);
}

