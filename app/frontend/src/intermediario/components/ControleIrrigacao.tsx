import { useState } from 'react';
import Button from '../../compartilhado/components/Button';
import { CheckIcon, PlayIcon, StopIcon, WarningIcon } from '../../compartilhado/components/icons';
import Modal from '../../compartilhado/components/Modal';
import { useHorta } from '../../compartilhado/hooks/useHorta';
import { FONTE_DADOS } from '../../compartilhado/utils/fonteDados';
import { descreverComando, podePararIrrigacao, rotuloEstadoIrrigacao, validarInicioIrrigacao } from '../../compartilhado/utils/irrigacao';

const DURACOES = [3, 5, 10];
const simulado = FONTE_DADOS.tipo === 'simulado';

/**
 * Controle básico da irrigação de UMA planta, sobre as ações que o sistema realmente tem (iniciar e parar).
 * Antes de iniciar: valida o estado (já em andamento, comando pendente, reservatório) e pede confirmação com os avisos.
 * Depois: mostra o estado e, separadamente, o que se sabe sobre o comando (enviado, falhou). "Comando enviado" nunca
 * é apresentado como "irrigando": o contrato com o backend ainda não devolve a confirmação do equipamento.
 */
export default function ControleIrrigacao({ plantaId }: { plantaId: string }) {
  const { plantas, monitoradas, sessaoDa, sensores, comandosIrrigacao, iniciarIrrigacao, pararIrrigacao } = useHorta();
  const [confirmando, setConfirmando] = useState(false);
  const [duracao, setDuracao] = useState(5);

  const planta = plantas.find((p) => p.id === plantaId);
  if (!planta) return null;
  const sessao = sessaoDa(plantaId);
  const comando = comandosIrrigacao[plantaId];
  const validacao = validarInicioIrrigacao(planta, monitoradas.find((m) => m.planta.id === plantaId), sessao, sensores, comando);
  const retorno = descreverComando(comando, simulado);
  const ligada = sessao.estado === 'ligada';

  const confirmar = () => {
    setConfirmando(false);
    if (validarInicioIrrigacao(planta, monitoradas.find((m) => m.planta.id === plantaId), sessao, sensores, comando).permitido) iniciarIrrigacao(plantaId, duracao);
  };

  return (
    <div className="inter-irrig-controle">
      <p className="inter-irrig-estado">
        <strong>{rotuloEstadoIrrigacao(sessao, comando, simulado)}</strong>
        {ligada && <> · há {sessao.decorridoMin} min{sessao.duracaoMin ? ` de ${sessao.duracaoMin}` : ''} · {sessao.origem === 'automatica' ? 'automática' : 'manual'}</>}
      </p>

      {ligada ? (
        <Button variant="danger" icon={<StopIcon width={16} height={16} />} disabled={!podePararIrrigacao(sessao) || comando?.situacao === 'enviando'} onClick={() => pararIrrigacao(plantaId)}>
          Parar irrigação
        </Button>
      ) : (
        <Button variant="primary" icon={<PlayIcon width={16} height={16} />} disabled={!validacao.permitido} onClick={() => setConfirmando(true)}>
          Iniciar irrigação
        </Button>
      )}

      {!ligada && !validacao.permitido && validacao.bloqueio && (
        <p className="inter-comando inter-comando-falhou"><WarningIcon width={15} height={15} aria-hidden="true" /> {validacao.bloqueio}</p>
      )}

      <p className={`inter-comando inter-comando-${retorno.situacao}`} role="status" aria-live="polite">
        {retorno.situacao !== 'nenhum' && (retorno.situacao === 'falhou' ? <WarningIcon width={15} height={15} aria-hidden="true" /> : <CheckIcon width={15} height={15} aria-hidden="true" />)}
        {retorno.texto}
      </p>

      <Modal open={confirmando} onClose={() => setConfirmando(false)} title={`Iniciar irrigação de ${planta.nome}?`}>
        <div className="inter-confirmar">
          <p>
            {planta.canteiro}: umidade atual {monitoradas.find((m) => m.planta.id === plantaId)?.estado === 'sem_dados' ? 'desconhecida' : `${planta.umidadeAtual}%`} (faixa ideal {planta.faixaMin}–{planta.faixaMax}%).
          </p>
          {validacao.avisos.length > 0 && (
            <ul className="inter-confirmar-avisos">
              {validacao.avisos.map((a) => <li key={a}><WarningIcon width={15} height={15} aria-hidden="true" /> {a}</li>)}
            </ul>
          )}
          <label className="inter-confirmar-duracao">
            <span>Duração</span>
            <select className="dropdown-trigger" value={duracao} onChange={(e) => setDuracao(Number(e.target.value))}>
              {DURACOES.map((d) => <option key={d} value={d}>{d} minutos</option>)}
            </select>
          </label>
          {simulado && <small className="api-hint">Modo simulado: nenhum equipamento físico será acionado.</small>}
          <div className="inter-confirmar-acoes">
            <Button variant="secondary" onClick={() => setConfirmando(false)}>Cancelar</Button>
            <Button variant="primary" onClick={confirmar}>Confirmar e iniciar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
