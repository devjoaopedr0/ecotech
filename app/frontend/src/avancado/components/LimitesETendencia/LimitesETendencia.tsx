import Card from '../../../compartilhado/components/Card';
import EmptyState from '../../../compartilhado/components/EmptyState';
import EstadoBadge from '../../../compartilhado/components/EstadoBadge';
import { LeafIcon } from '../../../compartilhado/components/icons';
import Table from '../../../compartilhado/components/Table';
import { useHorta } from '../../../compartilhado/hooks/useHorta';
import { tendenciaDaPlanta, TENDENCIA_MIN_JANELA_H, TENDENCIA_MIN_LEITURAS, TENDENCIA_MIN_R2, type PlantaMonitorada, type TendenciaMedida } from '../../../compartilhado/utils/horta';

const num = (v: number, casas = 1) => v.toFixed(casas).replace('.', ',');

function TextoTendencia({ t }: { t: TendenciaMedida }) {
  if (t.direcao === 'inconclusiva') return <span title={t.limitacao ?? undefined}>Inconclusiva<small className="alert-item-meta">{t.limitacao}</small></span>;
  if (t.direcao === 'estavel') return <span>Estável<small className="alert-item-meta">{num(t.taxaPorHora ?? 0)} p.p./h</small></span>;
  const seta = t.direcao === 'queda' ? '↓ Queda' : '↑ Alta';
  return (
    <span>
      {seta}: {num(Math.abs(t.taxaPorHora ?? 0))} p.p./h
      {t.horasAteCritico !== null && <small className="alert-item-meta">Estimativa: ~{num(t.horasAteCritico)} h até o limite crítico, mantido o ritmo</small>}
    </span>
  );
}

/**
 * Comparação entre plantas (avançada): umidade atual contra os limites configurados de cada planta e a tendência medida nas leituras reais.
 * Plantas sem leitura confiável não recebem tendência: o motivo aparece no lugar.
 */
export default function LimitesETendencia() {
  const { monitoradas, leituras, agora } = useHorta();

  const linha = (m: PlantaMonitorada) => ({ m, tendencia: m.estado === 'sem_dados' ? null : tendenciaDaPlanta(m.planta, leituras, agora) });
  const linhas = monitoradas.map(linha);

  return (
    <Card title="Plantas: limites e tendência" icon={<LeafIcon width={18} height={18} />}>
      {linhas.length === 0 ? (
        <EmptyState icone={<LeafIcon width={30} height={30} />} titulo="Nenhuma planta cadastrada" texto="Sem dados disponíveis." />
      ) : (
        <>
          <Table
            rowKey={({ m }) => m.planta.id}
            rows={linhas}
            columns={[
              { key: 'planta', header: 'Planta', render: ({ m }) => `${m.planta.emoji} ${m.planta.nome} · ${m.planta.canteiro}` },
              { key: 'umidade', header: 'Umidade', render: ({ m }) => (m.estado === 'sem_dados' ? '—' : `${m.planta.umidadeAtual}%`) },
              { key: 'limites', header: 'Limites configurados', render: ({ m }) => `crítica ${m.planta.umidadeCritica}% · mín. ${m.planta.umidadeMinima}% · máx. ${m.planta.umidadeMaxima}%` },
              { key: 'estado', header: 'Estado', render: ({ m }) => <EstadoBadge estado={m.estado} /> },
              { key: 'tendencia', header: 'Tendência (12 h)', render: ({ m, tendencia }) => (tendencia ? <TextoTendencia t={tendencia} /> : <span>Sem leitura confiável<small className="alert-item-meta">{m.motivo}</small></span>) },
            ]}
          />
          <small className="api-hint">
            Tendência medida por regressão linear das leituras de rotina das últimas 12 h. Só conclui com ao menos {TENDENCIA_MIN_LEITURAS} leituras, {TENDENCIA_MIN_JANELA_H} h de janela e ajuste de {TENDENCIA_MIN_R2 * 100}%.
            A estimativa até o limite crítico é indicativa: não considera chuva, irrigação futura nem mudanças de temperatura. Dados simulados.
          </small>
        </>
      )}
    </Card>
  );
}
