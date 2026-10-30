export interface OpcaoFiltro<T extends string> {
  valor: T;
  rotulo: string;
  /** Quantidade exibida ao lado do rótulo (ex.: itens do filtro). */
  contagem?: number;
}

interface Props<T extends string> {
  opcoes: OpcaoFiltro<T>[];
  valor: T;
  onChange: (valor: T) => void;
  rotulo: string;
}

/** Grupo de botões de filtro com o mesmo visual dos seletores de período do Monitor, Relatórios e Sensores. */
export default function FilterToggle<T extends string>({ opcoes, valor, onChange, rotulo }: Props<T>) {
  return (
    <div className="period-toggle" role="group" aria-label={rotulo}>
      {opcoes.map((o) => (
        <button key={o.valor} type="button" aria-pressed={valor === o.valor} className={`period-btn ${valor === o.valor ? 'period-btn-active' : ''}`} onClick={() => onChange(o.valor)}>
          {o.rotulo}
          {o.contagem !== undefined && ` (${o.contagem})`}
        </button>
      ))}
    </div>
  );
}
