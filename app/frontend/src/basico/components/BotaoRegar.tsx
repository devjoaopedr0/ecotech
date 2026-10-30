import { useState } from 'react';
import Button from '../../compartilhado/components/Button';
import { DropletIcon, StopIcon, WarningIcon } from '../../compartilhado/components/icons';
import Modal from '../../compartilhado/components/Modal';
import { useHorta } from '../../compartilhado/hooks/useHorta';
import { FONTE_DADOS } from '../../compartilhado/utils/fonteDados';
import { validarInicioIrrigacao } from '../../compartilhado/utils/irrigacao';
import { retornoDaRega } from '../regras/simples';

/** Na básica não se escolhe a duração: uma rega curta, que pode ser parada a qualquer momento. */
const DURACAO_MIN = 5;
const simulado = FONTE_DADOS.tipo === 'simulado';

/**
 * Botão grande de regar/parar UMA planta. Usa a mesma validação da intermediária (já regando, pedido em envio,
 * reservatório vazio) e sempre pede confirmação, mostrando os avisos antes.
 */
export default function BotaoRegar({ plantaId }: { plantaId: string }) {
  const { plantas, monitoradas, sessaoDa, sensores, comandosIrrigacao, iniciarIrrigacao, pararIrrigacao } = useHorta();
  const [confirmando, setConfirmando] = useState(false);

  const planta = plantas.find((p) => p.id === plantaId);
  if (!planta) return null;
  const monitorada = monitoradas.find((m) => m.planta.id === plantaId);
  const sessao = sessaoDa(plantaId);
  const comando = comandosIrrigacao[plantaId];
  const ligada = sessao.estado === 'ligada';
  const validacao = validarInicioIrrigacao(planta, monitorada, sessao, sensores, comando);
  const retorno = retornoDaRega(ligada, comando, simulado);

  const confirmar = () => {
    setConfirmando(false);
    if (validarInicioIrrigacao(planta, monitorada, sessao, sensores, comando).permitido) iniciarIrrigacao(plantaId, DURACAO_MIN);
  };

  return (
    <div className="basico-regar">
      {ligada ? (
        <Button variant="danger" fullWidth icon={<StopIcon width={20} height={20} />} disabled={comando?.situacao === 'enviando'} onClick={() => pararIrrigacao(plantaId)}>
          Parar de regar
        </Button>
      ) : (
        <Button variant="primary" fullWidth icon={<DropletIcon width={20} height={20} />} disabled={!validacao.permitido} onClick={() => setConfirmando(true)}>
          Regar
        </Button>
      )}

      {/* O bloqueio "pedido em envio" já aparece no retorno abaixo. */}
      {!ligada && validacao.bloqueio && comando?.situacao !== 'enviando' && <p className="basico-regar-msg basico-regar-falhou">{validacao.bloqueio}</p>}
      <p className={`basico-regar-msg ${retorno ? `basico-regar-${retorno.situacao}` : ''}`} role="status" aria-live="polite">
        {retorno?.texto}
      </p>

      <Modal open={confirmando} onClose={() => setConfirmando(false)} title={`Regar ${planta.nome}?`}>
        <div className="basico-confirmar">
          <p>A água vai ficar ligada por {DURACAO_MIN} minutos. Você pode parar antes, se quiser.</p>
          {validacao.avisos.length > 0 && (
            <ul>
              {validacao.avisos.map((a) => (
                <li key={a}>
                  <WarningIcon width={18} height={18} aria-hidden="true" /> {a}
                </li>
              ))}
            </ul>
          )}
          {simulado && <small className="api-hint">Modo simulado: nenhum equipamento será ligado.</small>}
          <div className="basico-confirmar-acoes">
            <Button variant="secondary" onClick={() => setConfirmando(false)}>Cancelar</Button>
            <Button variant="primary" onClick={confirmar}>Sim, regar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
