import { Link } from 'react-router-dom';
import Card from '../../compartilhado/components/Card';
import EmptyState from '../../compartilhado/components/EmptyState';
import Header from '../../compartilhado/components/Header';
import { ClockIcon, DropletIcon } from '../../compartilhado/components/icons';
import { FONTE_DADOS } from '../../compartilhado/utils/fonteDados';
import { formatarDataHora, formatarLitros } from '../../compartilhado/utils/format';
import { ROTAS_INTER } from '../../routes/paths';
import { ControleIrrigacao, IrrigacaoResumo, SemaforoBadge } from '../components';
import { semaforoDaPlanta } from '../regras/semaforo';
import { useIntermediario } from '../useIntermediario';

const LIMITE_OPERACOES = 5;

/**
 * Irrigação da intermediária: estado geral e controle planta a planta (iniciar/parar), com validação, confirmação e retorno
 * que distingue comando enviado de execução confirmada. Modo (automático/manual), duração livre, histórico e consumo ficam na avançada.
 */
export default function Irrigacao({ openMenu }: { openMenu?: () => void }) {
  const { monitoradas, sessaoDa, historicoIrrigacao } = useIntermediario();
  // Em andamento primeiro; depois a ordem de urgência já aplicada por useHorta.
  const ordenadas = [...monitoradas].sort((a, b) => Number(sessaoDa(b.planta.id).estado === 'ligada') - Number(sessaoDa(a.planta.id).estado === 'ligada'));

  return (
    <>
      <Header icon={<DropletIcon width={21} height={21} />} title="Irrigação" subtitle="Acompanhe e controle a irrigação de cada planta" onOpenMenu={openMenu} />
      <div className="page-body">
        {FONTE_DADOS.tipo === 'simulado' && (
          <p className="inter-aviso-fonte">Modo simulado: os comandos alteram apenas o estado exibido pelo sistema. Nenhum equipamento físico é acionado.</p>
        )}

        <Card title="Situação geral" icon={<DropletIcon width={18} height={18} />}>
          <IrrigacaoResumo />
        </Card>

        <Card title="Plantas">
          {ordenadas.length === 0 ? (
            <EmptyState icone={<DropletIcon width={30} height={30} />} titulo="Nenhuma planta cadastrada" texto="Cadastre plantas para controlar a irrigação." />
          ) : (
            <ul className="inter-irrig-lista">
              {ordenadas.map((m) => {
                const s = semaforoDaPlanta(m);
                const sessao = sessaoDa(m.planta.id);
                return (
                  <li key={m.planta.id} className="inter-irrig-item">
                    <div className="inter-irrig-planta">
                      <Link to={ROTAS_INTER.planta(m.planta.id)} className="inter-irrig-nome"><span aria-hidden="true">{m.planta.emoji}</span> {m.planta.nome}</Link>
                      <small>{m.planta.canteiro} · irrigação {sessao.modo === 'automatico' ? 'automática' : 'manual'}</small>
                      <small>Umidade: {m.estado === 'sem_dados' ? 'desconhecida' : `${m.planta.umidadeAtual}%`} · Última irrigação: {m.planta.ultimaIrrigacao}</small>
                      <SemaforoBadge nivel={s.nivel} rotulo={s.rotulo} />
                    </div>
                    <ControleIrrigacao plantaId={m.planta.id} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Últimas operações" icon={<ClockIcon width={18} height={18} />}>
          {historicoIrrigacao.length === 0 ? (
            <EmptyState icone={<ClockIcon width={30} height={30} />} titulo="Sem histórico de irrigação" texto="As irrigações concluídas aparecerão aqui." />
          ) : (
            <ul className="inter-atividades">
              {historicoIrrigacao.slice(0, LIMITE_OPERACOES).map((r) => (
                <li key={r.id}>
                  <span className="inter-atividade-icone" aria-hidden="true"><DropletIcon width={16} height={16} /></span>
                  <span>
                    <strong>{r.plantaNome} ({r.canteiro})</strong>
                    <small>{formatarDataHora(r.timestamp)} · {r.duracaoMin} min · {formatarLitros(r.litros)} · {r.modo === 'automatica' ? 'automática' : 'manual'}</small>
                    <small>Umidade de {r.umidadeAntes}% para {r.umidadeDepois}%</small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
