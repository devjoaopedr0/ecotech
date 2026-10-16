import { describe, expect, it } from 'vitest';
import { effectiveCalibration, environmentAlerts, isOnline, rawToPercent, validateCalibration } from './sensors';
import { conventionalDailyLiters, cycleLiters, localDate, summarizeWater } from './water';

describe('calibração', () => {
  const c = { rawDry: 3200, rawWet: 1300 };

  it('converte o bruto em % (mais alto = mais seco) e limita a 0–100', () => {
    expect(rawToPercent(3200, c)).toBe(0);
    expect(rawToPercent(1300, c)).toBe(100);
    expect(rawToPercent(2250, c)).toBe(50);
    expect(rawToPercent(4000, c)).toBe(0);
    expect(rawToPercent(100, c)).toBe(100);
  });

  it('usa a calibração padrão da placa enquanto não houver uma medida', () => {
    expect(effectiveCalibration({ board: 'ARDUINO', rawDry: null, rawWet: null })).toEqual({ rawDry: 800, rawWet: 330 });
    expect(effectiveCalibration({ board: 'ESP32', rawDry: 3000, rawWet: 1200 })).toEqual({ rawDry: 3000, rawWet: 1200 });
  });

  it('valida contra a escala da placa', () => {
    expect(validateCalibration('ESP32', c)).toBeNull();
    expect(validateCalibration('ARDUINO', c)).toMatch(/1023/);
    expect(validateCalibration('ESP32', { rawDry: 1000, rawWet: 1000 })).toMatch(/diferentes/);
  });
});

describe('sensores', () => {
  it('fica offline depois de 5 minutos sem leitura', () => {
    const now = new Date(Date.UTC(2026, 9, 15, 12, 0));
    expect(isOnline(new Date(now.getTime() - 4 * 60_000), now)).toBe(true);
    expect(isOnline(new Date(now.getTime() - 6 * 60_000), now)).toBe(false);
    expect(isOnline(null, now)).toBe(false);
  });

  it('gera alertas de reservatório, temperatura e estresse hídrico', () => {
    expect(environmentAlerts({ waterLevel: 19, temperature: 33, leafTemperature: 36 })).toEqual([
      { type: 'RESERVOIR_LOW', value: 19 },
      { type: 'HIGH_TEMPERATURE', value: 33 },
      { type: 'WATER_STRESS', value: 3 },
    ]);
    expect(environmentAlerts({ waterLevel: 20, temperature: 32, leafTemperature: 34.9 })).toEqual([]);
    expect(environmentAlerts({ leafTemperature: 40 })).toEqual([]);
  });
});

describe('água', () => {
  it('calcula litros do ciclo e a referência de horário fixo', () => {
    const start = new Date(Date.UTC(2026, 9, 15, 12, 0));
    expect(cycleLiters(start, new Date(start.getTime() + 4.5 * 60_000), 2)).toBe(9);
    expect(conventionalDailyLiters(null, 2)).toBe(8);
    expect(conventionalDailyLiters(0.5, 2)).toBe(4);
  });

  it('resume consumo, economia e custo', () => {
    expect(summarizeWater(30, 60, 6.48)).toEqual({
      usedLiters: 30,
      conventionalLiters: 60,
      savedLiters: 30,
      savingPercent: 50,
      cost: 0.19,
      savedCost: 0.19,
    });
    expect(summarizeWater(80, 60, 6.48).savedLiters).toBe(0);
  });

  it('separa os dias no fuso informado', () => {
    // 02:00 UTC ainda é o dia anterior em São Paulo (UTC−3).
    expect(localDate(new Date(Date.UTC(2026, 9, 16, 2, 0)), 'America/Sao_Paulo')).toBe('2026-10-15');
  });
});
