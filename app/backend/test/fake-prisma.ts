import { randomUUID } from 'node:crypto';

/**
 * Substituto em memória do PrismaService para os testes e2e: sobe a
 * aplicação NestJS real (guards, pipes, filtros, controllers) sem precisar
 * de um Postgres. Implementa só a fatia da API do Prisma que os services
 * usam: where com igualdade, OR, gte/lte/gt/lt, in e contains; orderBy de um
 * campo; skip/take; select raso; increment.
 */

type Row = Record<string, any>;

const DEFAULTS: Record<string, () => Row> = {
  user: () => ({ role: 'USER', sessionVersion: 0, lastLogin: null }),
  plantCatalog: () => ({}),
  plant: () => ({ catalogPlantId: null, species: null, emoji: '🌱', location: null }),
  device: () => ({ plantId: null, macAddress: null, location: null, active: true, lastSeenAt: null }),
  reading: () => ({ deviceId: null }),
  irrigationSettings: () => ({ mode: 'MANUAL', isOn: false }),
  irrigationEvent: () => ({ endedAt: null }),
  notificationPreference: () => ({ garden: true, email: false, system: true }),
  alert: () => ({ readAt: null }),
};

/** Modelos cuja chave primária não é `id`. */
const PRIMARY_KEY: Record<string, string> = {
  irrigationSettings: 'plantId',
  notificationPreference: 'userId',
};

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, condition]) => {
    if (key === 'OR') return (condition as Row[]).some((c) => matches(row, c));
    if (key === 'AND') return (condition as Row[]).every((c) => matches(row, c));
    const value = row[key];
    if (condition === null) return value === null || value === undefined;
    if (typeof condition === 'object' && !(condition instanceof Date)) {
      const c = condition as Row;
      if ('equals' in c && value !== c.equals) return false;
      if ('in' in c && !c.in.includes(value)) return false;
      if ('gte' in c && !(value >= c.gte)) return false;
      if ('gt' in c && !(value > c.gt)) return false;
      if ('lte' in c && !(value <= c.lte)) return false;
      if ('lt' in c && !(value < c.lt)) return false;
      if ('contains' in c) {
        const insensitive = c.mode === 'insensitive';
        const haystack = String(value ?? '');
        return insensitive
          ? haystack.toLowerCase().includes(String(c.contains).toLowerCase())
          : haystack.includes(c.contains);
      }
      return true;
    }
    return value === condition;
  });
}

function applyData(row: Row, data: Row): Row {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value && typeof value === 'object' && 'increment' in value) row[key] = (row[key] ?? 0) + value.increment;
    else row[key] = value;
  }
  row.updatedAt = new Date();
  return row;
}

function project(row: Row | null, select?: Row): Row | null {
  if (!row || !select) return row ? { ...row } : row;
  return Object.fromEntries(Object.keys(select).filter((k) => select[k]).map((k) => [k, row[k]]));
}

function sortRows(rows: Row[], orderBy?: Row): Row[] {
  if (!orderBy) return rows;
  const [[field, direction]] = Object.entries(orderBy);
  const sign = direction === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => (a[field] > b[field] ? sign : a[field] < b[field] ? -sign : 0));
}

function createModel(name: string) {
  const rows: Row[] = [];
  const pk = PRIMARY_KEY[name] ?? 'id';

  const create = (data: Row): Row => {
    const now = new Date();
    const row: Row = { ...DEFAULTS[name](), createdAt: now, updatedAt: now, ...(pk === 'id' ? { id: randomUUID() } : {}) };
    for (const [key, value] of Object.entries(data)) if (value !== undefined) row[key] = value;
    rows.push(row);
    return row;
  };

  const findMany = (args: Row = {}) => {
    let result = sortRows(rows.filter((r) => matches(r, args.where)), args.orderBy);
    if (args.skip) result = result.slice(args.skip);
    if (args.take !== undefined) result = result.slice(0, args.take);
    return result.map((r) => project(r, args.select));
  };

  return {
    rows,
    findUnique: async (args: Row) => project(rows.find((r) => matches(r, args.where)) ?? null, args.select),
    findFirst: async (args: Row = {}) => findMany({ ...args, take: 1 })[0] ?? null,
    findMany: async (args: Row = {}) => findMany(args),
    count: async (args: Row = {}) => rows.filter((r) => matches(r, args.where)).length,
    create: async (args: Row) => ({ ...create(args.data) }),
    update: async (args: Row) => {
      const row = rows.find((r) => matches(r, args.where));
      if (!row) throw Object.assign(new Error(`${name} não encontrado`), { code: 'P2025' });
      return { ...applyData(row, args.data) };
    },
    updateMany: async (args: Row) => {
      const targets = rows.filter((r) => matches(r, args.where));
      targets.forEach((r) => applyData(r, args.data));
      return { count: targets.length };
    },
    upsert: async (args: Row) => {
      const row = rows.find((r) => matches(r, args.where));
      if (row) return { ...applyData(row, args.update) };
      return { ...create({ ...args.where, ...args.create }) };
    },
    delete: async (args: Row) => {
      const index = rows.findIndex((r) => matches(r, args.where));
      if (index < 0) throw Object.assign(new Error(`${name} não encontrado`), { code: 'P2025' });
      return rows.splice(index, 1)[0];
    },
  };
}

export function createFakePrisma() {
  const models = Object.fromEntries(Object.keys(DEFAULTS).map((name) => [name, createModel(name)]));
  const fake: Row = {
    ...models,
    $connect: async () => undefined,
    $disconnect: async () => undefined,
    $transaction: async (arg: any) => (typeof arg === 'function' ? arg(fake) : Promise.all(arg)),
  };
  return fake as any;
}
