/** Baixa um CSV (UTF-8 com BOM para abrir corretamente no Excel). */
export function baixarCSV(nomeArquivo: string, linhas: string[][]) {
  const texto = linhas.map((l) => l.map((c) => (/[",\n;]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + texto], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}
