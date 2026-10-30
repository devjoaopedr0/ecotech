import { useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../compartilhado/components/EmptyState';
import FilterToggle from '../../compartilhado/components/FilterToggle';
import { HealthyIcon, LeafIcon, SearchIcon } from '../../compartilhado/components/icons';
import Input from '../../compartilhado/components/Input';
import { formatarRelativo } from '../../compartilhado/utils/format';
import { ROTAS_INTER } from '../../routes/paths';
import { useIntermediario } from '../useIntermediario';
import { filtrarPlantas, type FiltroPlantas } from '../regras/plantas';
import { semaforoDaPlanta, type NivelSemaforo } from '../regras/semaforo';
import SemaforoBadge from './SemaforoBadge';

const NIVEIS: NivelSemaforo[] = ['adequado', 'atencao', 'critico', 'sem_dados'];
const MENSAGEM_VAZIA: Record<FiltroPlantas, { titulo: string; texto: string }> = {
  todas: { titulo: 'Nenhuma planta encontrada', texto: 'Ajuste a busca ou cadastre plantas para acompanhar a horta.' },
  atencao: { titulo: 'Nenhuma planta precisa de atenção', texto: 'Todas as plantas com leitura confiável estão dentro dos limites.' },
  alertas: { titulo: 'Nenhuma planta com alerta', texto: 'Não há alertas ativos ligados a plantas.' },
  sem_dados: { titulo: 'Nenhum sensor indisponível', texto: 'Todas as plantas têm leitura confiável.' },
};

interface Props {
  /** Quantidade máxima de plantas exibidas (as mais urgentes primeiro); sem limite, mostra todas. */
  limite?: number;
  filtroInicial?: FiltroPlantas;
}

/**
 * Monitoramento das plantas: semáforo ambiental (contagens), busca por nome e filtros simples.
 * Um cartão por planta (já ordenadas da mais urgente para a menos), que abre o detalhe da planta.
 */
export default function MonitoramentoPlantas({ limite, filtroInicial = 'todas' }: Props) {
  const { monitoradas, comAlerta, semaforo } = useIntermediario();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<FiltroPlantas>(filtroInicial);

  const contagem = (f: FiltroPlantas) => filtrarPlantas(monitoradas, '', f, comAlerta).length;
  const filtradas = filtrarPlantas(monitoradas, busca, filtro, comAlerta);
  const visiveis = limite ? filtradas.slice(0, limite) : filtradas;

  if (monitoradas.length === 0) {
    return <EmptyState icone={<LeafIcon width={30} height={30} />} titulo="Nenhuma planta cadastrada" texto="Cadastre plantas para acompanhar a horta." />;
  }

  return (
    <>
      <ul className="inter-semaforo" aria-label="Semáforo ambiental: plantas por estado">
        {NIVEIS.map((n) => (
          <li key={n}><SemaforoBadge nivel={n} contagem={semaforo[n]} /></li>
        ))}
      </ul>

      <div className="filters-row">
        <Input icon={<SearchIcon width={16} height={16} />} placeholder="Buscar planta pelo nome" aria-label="Buscar planta pelo nome" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <FilterToggle
          rotulo="Filtrar plantas"
          valor={filtro}
          onChange={setFiltro}
          opcoes={[
            { valor: 'todas', rotulo: 'Todas', contagem: contagem('todas') },
            { valor: 'atencao', rotulo: 'Precisam de atenção', contagem: contagem('atencao') },
            { valor: 'alertas', rotulo: 'Com alertas', contagem: contagem('alertas') },
            { valor: 'sem_dados', rotulo: 'Sensor indisponível', contagem: contagem('sem_dados') },
          ]}
        />
      </div>

      {visiveis.length === 0 ? (
        <EmptyState icone={<HealthyIcon width={30} height={30} />} {...(busca.trim() ? MENSAGEM_VAZIA.todas : MENSAGEM_VAZIA[filtro])} />
      ) : (
        <ul className="inter-plantas">
          {visiveis.map((m) => {
            const s = semaforoDaPlanta(m);
            const semLeitura = m.estado === 'sem_dados';
            return (
              <li key={m.planta.id}>
                <Link className={`inter-planta inter-planta-${s.nivel}`} to={ROTAS_INTER.planta(m.planta.id)} aria-label={`${m.planta.nome}: ${s.rotulo}. Abrir detalhes`}>
                  <span className="inter-planta-nome"><span aria-hidden="true">{m.planta.emoji}</span> {m.planta.nome}</span>
                  <small>{m.planta.canteiro}</small>
                  <strong>{semLeitura ? '—' : `${m.planta.umidadeAtual}%`}</strong>
                  <SemaforoBadge nivel={s.nivel} rotulo={s.rotulo} />
                  <small>{semLeitura ? 'Umidade desconhecida (sem leitura confiável)' : `Ideal: ${m.planta.faixaMin}–${m.planta.faixaMax}% · Temp. ${m.planta.temperatura.toFixed(1).replace('.', ',')} °C`}</small>
                  <small>{m.ultimaLeituraMs ? `${semLeitura ? 'Última leitura registrada' : 'Atualizado'} ${formatarRelativo(m.ultimaLeituraMs)}` : 'Sem leitura registrada'}</small>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {limite !== undefined && filtradas.length > limite && <small className="api-hint">Mostrando {limite} de {filtradas.length} plantas (as mais urgentes primeiro).</small>}
    </>
  );
}
