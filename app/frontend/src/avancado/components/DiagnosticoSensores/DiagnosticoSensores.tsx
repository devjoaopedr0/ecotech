import Card from '../../../compartilhado/components/Card';
import EmptyState from '../../../compartilhado/components/EmptyState';
import { WifiIcon } from '../../../compartilhado/components/icons';
import StatusBadge from '../../../compartilhado/components/StatusBadge';
import Table from '../../../compartilhado/components/Table';
import { useHorta } from '../../../compartilhado/hooks/useHorta';
import { formatarDataHora, formatarRelativo } from '../../../compartilhado/utils/format';
import { ROTULO_TIPO_SENSOR } from '../../../compartilhado/utils/horta';
import { avaliarSensor, ROTULO_SITUACAO_LEITURA, ultimaComunicacaoMs, type SituacaoLeitura } from '../../../compartilhado/utils/sensores';

const SEVERIDADE: Record<SituacaoLeitura, 'ideal' | 'atencao' | 'critico'> = { ok: 'ideal', ausente: 'atencao', offline: 'critico', travada: 'atencao', invalida: 'atencao', desatualizada: 'atencao' };

/**
 * Diagnóstico de confiabilidade (avançada). Cada conclusão mostra a evidência que a sustenta.
 * Não há "defeituoso": o sistema só afirma o que os dados mostram (sem comunicação, sem variação, fora da escala, atrasada).
 * Histórico de disponibilidade e de falhas depende de registro no backend (ver docs).
 */
export default function DiagnosticoSensores() {
  const { sensores, leituras, agora } = useHorta();
  const linhas = sensores.map((s) => ({ s, leitura: avaliarSensor(s, leituras, agora), ultima: ultimaComunicacaoMs(s, leituras) }));
  const comProblema = linhas.filter((l) => !l.leitura.confiavel).length;

  return (
    <Card title="Diagnóstico de confiabilidade" icon={<WifiIcon width={18} height={18} />}>
      {linhas.length === 0 ? (
        <EmptyState icone={<WifiIcon width={30} height={30} />} titulo="Nenhum sensor cadastrado" texto="Sem dados disponíveis." />
      ) : (
        <>
          <p className="diag-resumo" role="status">
            {comProblema === 0 ? 'Todas as leituras estão confiáveis.' : `${comProblema} de ${linhas.length} sensor(es) com leitura não confiável; esses valores não alimentam o estado das plantas, os alertas de umidade nem a irrigação automática.`}
          </p>
          <Table
            rowKey={(l) => l.s.id}
            rows={linhas}
            columns={[
              { key: 'sensor', header: 'Sensor', render: ({ s }) => `${s.nome} · ${ROTULO_TIPO_SENSOR[s.tipo]}` },
              { key: 'situacao', header: 'Situação', render: ({ leitura }) => <StatusBadge status={SEVERIDADE[leitura.situacao]} label={ROTULO_SITUACAO_LEITURA[leitura.situacao]} /> },
              { key: 'evidencia', header: 'Evidência', render: ({ leitura }) => leitura.detalhe },
              { key: 'ultima', header: 'Última leitura', render: ({ ultima }) => (ultima ? `${formatarRelativo(ultima, agora)} (${formatarDataHora(ultima)})` : 'Horário não informado') },
              {
                key: 'frequencia',
                header: 'Frequência esperada',
                render: ({ leitura }) => (leitura.intervaloEsperadoMs ? `a cada ~${Math.max(1, Math.round(leitura.intervaloEsperadoMs / 60_000))} min` : 'Dados insuficientes'),
              },
            ]}
          />
          <small className="api-hint">
            A frequência esperada é a mediana do intervalo entre leituras de rotina; só existe para sensores de umidade, únicos com horário registrado. Uma leitura é desatualizada após 3× esse intervalo.
            Histórico de disponibilidade e de falhas de comunicação exige registro no backend e ainda não existe. Dados simulados.
          </small>
        </>
      )}
    </Card>
  );
}
