import { Link } from 'react-router-dom';
import AlertList, { type ItemAlerta } from '../../compartilhado/components/AlertList';
import EmptyState from '../../compartilhado/components/EmptyState';
import { HealthyIcon } from '../../compartilhado/components/icons';
import { formatarDataHora } from '../../compartilhado/utils/format';
import { ROTULO_PRIORIDADE } from '../../compartilhado/utils/horta';
import { ROTAS_INTER } from '../../routes/paths';
import type { ItemCentral } from '../regras/central';

/** Converte uma ocorrência da central no item exibido pelo AlertList (mesmo visual da avançada). */
function itemDaCentral(i: ItemCentral): ItemAlerta {
  const valor = [i.valorObservado && `Valor observado: ${i.valorObservado}`, i.limite && `Limite: ${i.limite}`].filter(Boolean).join(' · ');
  return {
    id: i.id,
    severidade: i.severidade,
    rotulo: `Prioridade ${ROTULO_PRIORIDADE[i.prioridade]}`,
    titulo: i.titulo,
    mensagem: i.descricao,
    meta: (
      <>
        {valor && <span className="meta-line">{valor}</span>}
        <span className="meta-line">
          {i.quando ? formatarDataHora(i.quando) : 'Condição ativa agora (início não registrado)'}
          {i.planta && <> · Planta: <Link to={ROTAS_INTER.planta(i.planta.id)}>{i.planta.nome}</Link></>}
          {i.dispositivo && <> · Dispositivo: {i.dispositivo}</>}
        </span>
        {i.acao && <span className="meta-line meta-action"><strong>O que fazer:</strong> {i.acao}</span>}
      </>
    ),
  };
}

/** Lista da Central de atenção; sem ocorrências, mostra um estado positivo discreto. */
export default function CentralAtencao({ itens, limite }: { itens: ItemCentral[]; limite?: number }) {
  if (itens.length === 0) {
    return <EmptyState icone={<HealthyIcon width={30} height={30} />} titulo="Nada exige atenção agora" texto="Nenhuma ocorrência ativa nos dados disponíveis." />;
  }
  return (
    <>
      <AlertList alertas={itens.map(itemDaCentral)} limite={limite} />
      {limite !== undefined && itens.length > limite && <small className="api-hint">+ {itens.length - limite} ocorrências na página Alertas</small>}
    </>
  );
}
