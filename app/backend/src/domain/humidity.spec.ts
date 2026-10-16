import { describe, expect, it } from 'vitest';
import { attentionThreshold, autoIrrigationDecision, bucketize, computeStats, humidityStatus } from './humidity';

const range = { humidityMin: 40, humidityMax: 80 };

describe('humidityStatus', () => {
  it('classifica abaixo, atenção, ideal e alto', () => {
    expect(attentionThreshold(range)).toBe(46);
    expect(humidityStatus(39.9, range)).toBe('LOW');
    expect(humidityStatus(40, range)).toBe('ATTENTION');
    expect(humidityStatus(45.9, range)).toBe('ATTENTION');
    expect(humidityStatus(46, range)).toBe('IDEAL');
    expect(humidityStatus(80, range)).toBe('IDEAL');
    expect(humidityStatus(80.1, range)).toBe('HIGH');
  });
});

describe('autoIrrigationDecision', () => {
  it('liga abaixo do mínimo', () => {
    expect(autoIrrigationDecision(35, range, false)).toBe(true);
  });

  it('mantém o estado na zona de atenção (histerese)', () => {
    expect(autoIrrigationDecision(42, range, true)).toBe(true);
    expect(autoIrrigationDecision(42, range, false)).toBe(false);
  });

  it('desliga ao voltar para o ideal ou passar do máximo', () => {
    expect(autoIrrigationDecision(50, range, true)).toBe(false);
    expect(autoIrrigationDecision(90, range, true)).toBe(false);
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
