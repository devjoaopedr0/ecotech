import { useState } from 'react';
import FilterToggle from '../../compartilhado/components/FilterToggle';
import GraficoUmidade from '../../compartilhado/components/GraficoUmidade';
import { useHorta } from '../../compartilhado/hooks/useHorta';
import { PERIODOS_BASICOS, periodoPorId, serieUmidade, variacaoDaSerie, type PeriodoId } from '../../compartilhado/utils/horta';
import { LIMIAR_MUDANCA_RELEVANTE } from '../regras/recomendacoes';
import { formatarNumero } from '../regras/formato';

interface Props {
  /** Planta fixa (página de detalhe). Sem isso, o usuário escolhe entre a média da horta e cada planta. */
  plantaFixaId?: string;
}

/**
 * Gráfico principal da intermediária: umidade do solo, com seleção de planta e período básico (24 h, 7 e 30 dias).
 * Usa o GraficoUmidade compartilhado (mesma série e mesmo visual da avançada). Sem histórico, mostra estado vazio.
 * Abaixo do gráfico, um resumo textual com o valor atual, a variação e o intervalo observado; mudanças grandes são sinalizadas.
 */
export default function GraficoPrincipal({ plantaFixaId }: Props) {
  const { plantas, leituras, consumo, agora } = useHorta();
  const [escolhida, setEscolhida] = useState('');
  const [periodo, setPeriodo] = useState<PeriodoId>('24h');
  const plantaId = plantaFixaId ?? escolhida;
  const planta = plantas.find((p) => p.id === plantaId);

  const serie = serieUmidade(periodo, leituras, consumo, agora, planta?.id);
  const porPlanta = !!planta && !serie.indisponivelParaPlanta;
  const valores = serie.pontos.map((p) => p.valor);
  const variacao = variacaoDaSerie(serie.pontos);

  return (
    <>
      <div className="filters-row">
        {!plantaFixaId && (
          <label className="field-select">
            <span className="field-select-label">Planta</span>
            <select className="dropdown-trigger" value={escolhida} onChange={(e) => setEscolhida(e.target.value)} aria-label="Escolher a planta do gráfico">
              <option value="">Média da horta</option>
              {plantas.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.nome} ({p.canteiro})</option>)}
            </select>
          </label>
        )}
        <FilterToggle rotulo="Período do gráfico" valor={periodo} onChange={setPeriodo} opcoes={PERIODOS_BASICOS.map((p) => ({ valor: p.id, rotulo: p.curto }))} />
      </div>

      <GraficoUmidade periodo={periodo} plantaId={planta?.id} nomePlanta={planta?.nome} limites={planta ? { critica: planta.umidadeCritica, minima: planta.umidadeMinima } : undefined} />

      {valores.length > 0 && (
        <p className="inter-grafico-resumo">
          {periodoPorId(periodo).rotulo}, {porPlanta ? planta.nome : 'média da horta'}: último valor <strong>{valores[valores.length - 1]}%</strong>
          {variacao !== null && <> · variação de <strong>{variacao > 0 ? '+' : ''}{formatarNumero(variacao)} p.p.</strong></>}
          {valores.length > 1 && <> · mínima {Math.min(...valores)}% · máxima {Math.max(...valores)}%</>}
          {variacao !== null && Math.abs(variacao) >= LIMIAR_MUDANCA_RELEVANTE && <span className="inter-grafico-destaque"> · Mudança relevante no período</span>}
        </p>
      )}
    </>
  );
}
