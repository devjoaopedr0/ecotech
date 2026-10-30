import { useState } from 'react';
import Card from '../../../compartilhado/components/Card';
import EmptyState from '../../../compartilhado/components/EmptyState';
import FilterToggle from '../../../compartilhado/components/FilterToggle';
import { StatsIcon } from '../../../compartilhado/components/icons';
import Table from '../../../compartilhado/components/Table';
import { useHorta } from '../../../compartilhado/hooks/useHorta';
import { formatarLitros } from '../../../compartilhado/utils/format';
import { compararPeriodos, type MetricaComparada } from '../../../compartilhado/utils/horta';

const OPCOES = [
  { valor: '7', rotulo: '7 dias' },
  { valor: '14', rotulo: '14 dias' },
];

const sinal = (v: number) => (v > 0 ? `+${v}` : `${v}`).replace('.', ',');

interface Linha {
  id: string;
  rotulo: string;
  metrica: MetricaComparada;
  formato: (v: number) => string;
  unidadeVariacao: string;
}

/**
 * Comparação entre períodos equivalentes (avançada): últimos N dias completos contra os N anteriores, com variação absoluta e percentual.
 * Usa o histórico diário do sistema (hoje simulado); o dia corrente fica de fora por estar incompleto.
 */
export default function ComparacaoPeriodos() {
  const { consumo } = useHorta();
  const [periodo, setPeriodo] = useState('7');
  const dias = Number(periodo);
  const c = compararPeriodos(consumo, dias);

  const linhas: Linha[] = c
    ? [
        { id: 'umidade', rotulo: 'Umidade média da horta', metrica: c.umidadeMedia, formato: (v) => `${v}%`, unidadeVariacao: ' p.p.' },
        { id: 'agua', rotulo: 'Água utilizada', metrica: c.aguaUtilizada, formato: formatarLitros, unidadeVariacao: ' L' },
        { id: 'criticos', rotulo: 'Dias com planta em estado crítico', metrica: c.diasComPlantaCritica, formato: (v) => `${v}`, unidadeVariacao: ' dia(s)' },
        { id: 'alertas', rotulo: 'Alertas gerados', metrica: c.alertas, formato: (v) => `${v}`, unidadeVariacao: '' },
      ]
    : [];

  return (
    <Card title="Comparação entre períodos" icon={<StatsIcon width={18} height={18} />} action={<FilterToggle opcoes={OPCOES} valor={periodo} onChange={setPeriodo} rotulo="Período comparado" />}>
      {!c ? (
        <EmptyState titulo="Histórico insuficiente" texto={`São necessários ${dias * 2} dias completos de histórico para comparar ${dias} dias com os ${dias} anteriores.`} />
      ) : (
        <>
          <Table
            rowKey={(l) => l.id}
            rows={linhas}
            columns={[
              { key: 'metrica', header: 'Métrica', render: (l) => l.rotulo },
              { key: 'atual', header: `Últimos ${dias} dias`, render: (l) => <strong>{l.formato(l.metrica.atual)}</strong> },
              { key: 'anterior', header: `${dias} dias anteriores`, render: (l) => l.formato(l.metrica.anterior) },
              { key: 'variacao', header: 'Variação', render: (l) => `${sinal(l.metrica.variacao)}${l.unidadeVariacao}${l.metrica.variacaoPct === null ? '' : ` (${sinal(l.metrica.variacaoPct)}%)`}` },
            ]}
          />
          <small className="api-hint">Dias completos, sem contar hoje. Histórico simulado; em p.p. (pontos percentuais) a variação é absoluta, sem percentual.</small>
        </>
      )}
    </Card>
  );
}
