import { BadRequestException } from '@nestjs/common';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Converte e valida um intervalo `from`/`to` (ISO 8601) de no máximo
 * `maxDays` dias. */
export function parseRange(from: string, to: string, maxDays: number): { from: Date; to: Date } {
  const start = new Date(from);
  const end = new Date(to);
  if (start.getTime() >= end.getTime()) throw new BadRequestException('from deve ser anterior a to.');
  if (end.getTime() - start.getTime() > maxDays * DAY_MS) {
    throw new BadRequestException(`O intervalo pode ter no máximo ${maxDays} dias.`);
  }
  return { from: start, to: end };
}
