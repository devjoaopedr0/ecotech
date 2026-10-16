import { describe, expect, it } from 'vitest';
import {
  autoIrrigationDecision,
  bucketize,
  computeStats,
  deriveThresholds,
  dryingRatePerHour,
  humidityStatus,
  irrigationReason,
  shouldStopCycle,
  validateThresholds,
} from './humidity';

// Mesmos limites do alface no mock do frontend.
const t = { humidityCritical: 40, humidityLow: 45, idealMin: 50, idealMax: 70, humidityHigh: 80 };

describe('humidityStatus', () => {
  it('classifica crítico, baixo, ideal e alto', () => {
    expect(humidityStatus(39.9, t)).toBe('CRITICAL');
    expect(humidityStatus(40, t)).toBe('LOW');
    expect(humidityStatus(44.9, t)).toBe('LOW');
    expect(humidityStatus(45, t)).toBe('IDEAL');
    expect(humidityStatus(80, t)).toBe('IDEAL');
    expect(humidityStatus(80.1, t)).toBe('HIGH');
  });
});

describe('limites', () => {
  it('deriva os limites a partir da faixa ideal', () => {
    expect(deriveThresholds(50, 70)).toEqual(t);
    expect(deriveThresholds(3, 95)).toEqual({ humidityCritical: 0, humidityLow: 1, idealMin: 3, idealMax: 95, humidityHigh: 100 });
  });

  it('valida a ordem', () => {
    expect(validateThresholds(t)).toBeNull();
    expect(validateThresholds({ ...t, humidityCritical: 45 })).toMatch(/humidityCritical/);
    expect(validateThresholds({ ...t, humidityLow: 55 })).toMatch(/humidityLow/);
    expect(validateThresholds({ ...t, idealMin: 70 })).toMatch(/idealMin/);
    expect(validateThresholds({ ...t, humidityHigh: 60 })).toMatch(/humidityHigh/);
    expect(validateThresholds({ ...t, humidityHigh: 101 })).toMatch(/entre 0 e 100/);
  });
});

describe('autoIrrigationDecision', () => {
  it('liga só abaixo do crítico', () => {
    expect(autoIrrigationDecision(39, t, false, false)).toBe(true);
    expect(autoIrrigationDecision(42, t, false, false)).toBe(false);
  });

  it('mantém ligada até o início da faixa ideal (histerese)', () => {
    expect(autoIrrigationDecision(45, t, true, false)).toBe(true);
    expect(autoIrrigationDecision(50, t, true, false)).toBe(false);
  });

  it('não religa com o bloqueio do usuário', () => {
    expect(autoIrrigationDecision(30, t, false, true)).toBe(false);
  });
});

describe('ciclos', () => {
  const start = new Date(Date.UTC(2026, 9, 15, 12, 0));
  const after = (min: number) => new Date(start.getTime() + min * 60_000);

  it('para o automático no limite de tempo', () => {
    const cycle = { source: 'AUTO' as const, startedAt: start, plannedDurationMin: null };
    expect(shouldStopCycle(cycle, 42, t, after(19))).toBe(false);
    expect(shouldStopCycle(cycle, 42, t, after(20))).toBe(true);
  });

  it('para o manual na duração pedida ou acima da máxima', () => {
    const timed = { source: 'MANUAL' as const, startedAt: start, plannedDurationMin: 5 };
    expect(shouldStopCycle(timed, 60, t, after(4))).toBe(false);
    expect(shouldStopCycle(timed, 60, t, after(5))).toBe(true);
    const open = { ...timed, plannedDurationMin: null };
    expect(shouldStopCycle(open, 80, t, after(90))).toBe(false);
    expect(shouldStopCycle(open, 81, t, after(1))).toBe(true);
  });

  it('registra o motivo conforme a origem e a umidade', () => {
    expect(irrigationReason('AUTO', 39, t)).toBe('Umidade abaixo do nível crítico.');
    expect(irrigationReason('MANUAL', 42, t)).toBe('Umidade abaixo do ideal.');
    expect(irrigationReason('MANUAL', 60, t)).toBe('Acionamento manual.');
    expect(irrigationReason('MANUAL', null, t)).toBe('Acionamento manual.');
  });
});

describe('computeStats', () => {
  const at = (minutes: number, humidity: number) => ({
    humidity,
    createdAt: new Date(Date.UTC(2026, 9, 15, 0, minutes)),
  });

  it('devolve nulos sem leituras', () => {
    expect(computeStats([])).toMatchObject({ count: 0, current: null, trend: null });
  });

  it('calcula média, extremos, amplitude e tendência', () => {
    const stats = computeStats([at(0, 60), at(10, 58), at(20, 50), at(30, 48)]);
    expect(stats).toEqual({ count: 4, current: 48, avg: 54, min: 48, max: 60, amplitude: 12, trend: 'DOWN' });
    expect(computeStats([at(0, 50), at(10, 50.5)]).trend).toBe('STABLE');
    expect(computeStats([at(0, 40), at(10, 55)]).trend).toBe('UP');
  });

  it('estima a secagem ignorando as subidas (irrigação)', () => {
    // Cai 2 pontos em 1 h, sobe 20 com irrigação, cai mais 1 em 30 min.
    expect(dryingRatePerHour([at(0, 50), at(60, 48), at(70, 68), at(100, 67)])).toBe(2);
    expect(dryingRatePerHour([at(0, 50), at(10, 49)])).toBeNull();
  });
});

describe('bucketize', () => {
  it('agrupa por janela e ordena', () => {
    const hour = 60 * 60 * 1000;
    const base = Date.UTC(2026, 9, 15);
    const buckets = bucketize(
      [
        { humidity: 50, createdAt: new Date(base + hour + 1000) },
        { humidity: 40, createdAt: new Date(base + 10) },
        { humidity: 60, createdAt: new Date(base + 20) },
      ],
      hour,
    );
    expect(buckets).toEqual([
      { start: new Date(base), avg: 50, min: 40, max: 60, count: 2 },
      { start: new Date(base + hour), avg: 50, min: 50, max: 50, count: 1 },
    ]);
  });
});
