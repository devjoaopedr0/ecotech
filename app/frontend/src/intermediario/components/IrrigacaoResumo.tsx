import { Link } from 'react-router-dom';
import { useHorta } from '../../compartilhado/hooks/useHorta';
import { formatarDataHora, formatarLitros } from '../../compartilhado/utils/format';
import { LIMITE_RESERVATORIO_BAIXO } from '../../compartilhado/utils/alertas';
import { ROTAS_INTER } from '../../routes/paths';

/** Resumo da irrigação para o Início: estado, reservatório, última operação e falhas confirmadas. O controle fica na página Irrigação. */
export default function IrrigacaoResumo() {
  const { plantas, sessaoDa, sensores, historicoIrrigacao, comandosIrrigacao, irrigacoesAtivas } = useHorta();
  const reservatorio = sensores.find((s) => s.tipo === 'nivel_agua');
  const ultima = historicoIrrigacao[0];
  const ativas = plantas.filter((p) => sessaoDa(p.id).estado === 'ligada');
  const falhas = Object.entries(comandosIrrigacao).filter(([, c]) => c.situacao === 'falhou');

  const textoReservatorio = !reservatorio ? 'Sem sensor de nível' : reservatorio.status !== 'online' ? 'Indisponível (sensor sem comunicação)' : reservatorio.valor < LIMITE_RESERVATORIO_BAIXO ? `Baixo (${reservatorio.valor}%)` : `${reservatorio.valor}% · adequado`;

  return (
    <>
      <div className="info-row"><span>Estado</span><strong>{irrigacoesAtivas > 0 ? `Em andamento: ${ativas.map((p) => p.nome).join(', ')}` : 'Em espera'}</strong></div>
      <div className="info-row"><span>Reservatório</span><strong>{textoReservatorio}</strong></div>
      <div className="info-row"><span>Última operação</span><strong>{ultima ? `${ultima.plantaNome} · ${formatarDataHora(ultima.timestamp)} · ${ultima.duracaoMin} min · ${formatarLitros(ultima.litros)}` : 'Sem histórico de irrigação'}</strong></div>
      {falhas.length > 0 && <p className="inter-comando inter-comando-falhou">Falha confirmada no envio de comando de irrigação ({falhas.length}). Veja a Central de atenção.</p>}
      <p className="inter-irrig-link"><Link className="link-btn" to={ROTAS_INTER.irrigacao}>Abrir controle de irrigação</Link></p>
    </>
  );
}
