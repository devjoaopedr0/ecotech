const dois = (n: number) => String(n).padStart(2, '0');

export function formatarData(ms: number): string {
  const d = new Date(ms);
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatarHora(ms: number): string {
  const d = new Date(ms);
  return `${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

export function formatarDataHora(ms: number): string {
  return `${formatarData(ms)} às ${formatarHora(ms)}`;
}

export function formatarDuracao(min: number): string {
  return `${min} ${min === 1 ? 'minuto' : 'minutos'}`;
}

export function formatarLitros(l: number): string {
  return `${Number.isInteger(l) ? l : l.toFixed(1)} L`;
}

export function formatarRelativo(ms: number, agora = Date.now()): string {
  const min = Math.max(0, Math.round((agora - ms) / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.round(h / 24)} d`;
}

export function formatarDiaMes(ms: number): string {
  const d = new Date(ms);
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}`;
}
