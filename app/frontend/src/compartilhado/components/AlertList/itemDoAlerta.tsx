import type { Alerta, Plant } from '../../types';
import { formatarDataHora } from '../../utils/format';
import { alertaRequerAcao, prioridadeDoAlerta, ROTULO_PRIORIDADE } from '../../utils/horta';
import type { ReactNode } from 'react';
import type { ItemAlerta } from './AlertList';

/**
 * Quanto do alerta é exibido:
 *  - resumo:    título, mensagem curta e a ação recomendada (intermediária, Visão Geral)
 *  - padrao:    resumo + estado, horário e planta (intermediária, página Alertas)
 *  - detalhado: padrao + indicador, valor atual e limite de referência (avançada), em "Dados técnicos" recolhível
 */
export type NivelAlerta = 'resumo' | 'padrao' | 'detalhado';

interface Opcoes {
  nivel?: NivelAlerta;
  /** Monta o link da planta relacionada; sem isso, mostra só o nome. */
  linkPlanta?: (planta: Plant, texto: string) => ReactNode;
}

/** Converte um alerta do sistema no item exibido pelo AlertList: o que aconteceu, por quê e o que fazer. */
export function itemDoAlerta(a: Alerta, plantas: Plant[], { nivel = 'padrao', linkPlanta }: Opcoes = {}): ItemAlerta {
  const planta = a.plantaId ? plantas.find((p) => p.id === a.plantaId) : undefined;
  const linhas: ReactNode[] = [];
  let detalhes: ReactNode | undefined;

  if (a.acao) linhas.push(<span className="meta-action"><strong>O que fazer:</strong> {a.acao}</span>);
  if (nivel !== 'resumo') {
    const quando = a.criadoEm > 0 ? formatarDataHora(a.criadoEm) : 'condição ativa agora';
    const textoPlanta = `Planta: ${planta?.nome ?? ''}`;
    linhas.push(
      <>
        {alertaRequerAcao(a) ? 'Ativo' : 'Informativo'} · {quando}
        {planta && <> · {linkPlanta ? linkPlanta(planta, textoPlanta) : textoPlanta}</>}
      </>
    );
  }
  if (nivel === 'detalhado') {
    const dados = [a.indicador && `Indicador: ${a.indicador}`, a.valorAtual && `Valor atual: ${a.valorAtual}`, a.limite && `Limite de referência: ${a.limite}`].filter(Boolean) as string[];
    detalhes = dados.length ? dados.map((d) => <span key={d} className="meta-line">{d}</span>) : <span className="meta-line">Sem valor de referência registrado.</span>;
  }

  return {
    id: a.id,
    severidade: a.severidade,
    rotulo: `Prioridade ${ROTULO_PRIORIDADE[prioridadeDoAlerta(a.severidade)]}`,
    titulo: a.titulo,
    mensagem: a.mensagem,
    meta: linhas.length ? linhas.map((l, i) => <span key={i} className="meta-line">{l}</span>) : undefined,
    detalhes,
  };
}
