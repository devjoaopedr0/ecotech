import type { ReactNode } from 'react';
import './Table.css';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  /** No celular, cada linha vira um cartão (rótulo: valor) em vez de rolar na horizontal. */
  cartoesNoCelular?: boolean;
  /** Descrição da tabela para leitores de tela. */
  legenda?: string;
}

export default function Table<T>({ columns, rows, rowKey, emptyMessage = 'Nenhum registro encontrado.', cartoesNoCelular = false, legenda }: TableProps<T>) {
  return (
    <div className="table-scroll scroll-x">
      <table className={`app-table ${cartoesNoCelular ? 'app-table-cartoes' : ''}`}>
        {legenda && <caption className="sr-only">{legenda}</caption>}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" style={{ textAlign: c.align || 'left', width: c.width }}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((c) => (
                  <td key={c.key} data-label={c.header} style={{ textAlign: c.align || 'left' }}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
