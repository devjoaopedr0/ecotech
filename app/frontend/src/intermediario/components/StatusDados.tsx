import { useEffect, useState } from 'react';
import { useHorta } from '../../compartilhado/hooks/useHorta';
import { ClockIcon, WarningIcon, WifiIcon } from '../../compartilhado/components/icons';
import Button from '../../compartilhado/components/Button';
import { FONTE_DADOS } from '../../compartilhado/utils/fonteDados';
import { formatarHora, formatarRelativo } from '../../compartilhado/utils/format';
import { avaliarAtualizacao } from '../regras/atualizacao';

/**
 * Faixa de atualização dos dados: horário da última leitura, estado da fonte e dos sensores, aviso de desatualização
 * e atualização manual. A atualização manual registra uma nova leitura de cada sensor de umidade online (a única
 * operação de coleta que o sistema oferece hoje). Não há requisição de rede: se existir uma, a falha deve manter os últimos dados e avisar.
 */
export default function StatusDados() {
  const { plantas, leituras, sensores, agora, registrarLeituras, indicadores } = useHorta();
  const [retorno, setRetorno] = useState<string | null>(null);
  const status = avaliarAtualizacao(plantas, leituras, agora);
  const { online, total } = indicadores.dispositivos;

  useEffect(() => {
    if (!retorno) return;
    const t = setTimeout(() => setRetorno(null), 6000);
    return () => clearTimeout(t);
  }, [retorno]);

  const atualizar = () => {
    const semComunicacao = sensores.filter((s) => s.tipo === 'umidade' && s.status !== 'online').length;
    registrarLeituras();
    setRetorno(`Leituras registradas às ${formatarHora(Date.now())}.${semComunicacao > 0 ? ` ${semComunicacao} sensor(es) sem comunicação não enviaram leitura.` : ''}`);
  };

  return (
    <section className={`inter-status ${status.desatualizado ? 'inter-status-aviso' : ''}`} aria-label="Atualização dos dados">
      <div className="inter-status-info">
        <span className="inter-status-item">
          <ClockIcon width={15} height={15} aria-hidden="true" />
          {status.ultimaMs ? `Última leitura: ${formatarRelativo(status.ultimaMs, agora)} (${formatarHora(status.ultimaMs)})` : 'Nenhuma leitura registrada'}
        </span>
        <span className="inter-status-item" title={FONTE_DADOS.descricao}>
          <WifiIcon width={15} height={15} aria-hidden="true" />
          {FONTE_DADOS.tipo === 'simulado' ? 'Dados simulados' : 'Conectado à API'} · {online} de {total} sensores conectados
        </span>
      </div>
      <Button variant="secondary" onClick={atualizar} title="Registra uma nova leitura de cada sensor de umidade conectado">
        Atualizar leituras
      </Button>
      <div className="inter-status-msg" role="status" aria-live="polite">
        {status.desatualizado && status.aviso && (
          <span className="inter-status-alerta">
            <WarningIcon width={15} height={15} aria-hidden="true" /> {status.aviso}
          </span>
        )}
        {retorno && <span>{retorno}</span>}
      </div>
    </section>
  );
}
