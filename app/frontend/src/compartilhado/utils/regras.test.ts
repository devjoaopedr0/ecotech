import { describe, expect, it } from 'vitest';
import type { ConsumoDia, LeituraColetada, Plant, Sensor } from '../types';
import { gerarAlertasDeEstado } from './alertas';
import { calcularIndicadores, compararPeriodos, diagnosticarPlanta, tendenciaDaPlanta, ultimasLeituras } from './horta';
import { culturasIniciais, leiturasIniciais, plantasIniciais, sensoresIniciais, sessoesIniciais } from './mockData';
import { avaliarSensor, intervaloEsperadoMs, ultimaComunicacaoMs } from './sensores';

const H = 3_600_000;
const AGORA = Date.now();

const planta = (extra: Partial<Plant> = {}): Plant => ({ ...plantasIniciais[4], id: 'p1', umidadeAtual: 55, ...extra });
const sensor = (extra: Partial<Sensor> = {}): Sensor => ({ id: 'umi-p1', codigo: '001', nome: 'Sensor #001', tipo: 'umidade', status: 'online', valor: 55, localizacao: 'Teste', plantaId: 'p1', ...extra });
const leitura = (horasAtras: number, umidade: number, fase: LeituraColetada['fase'] = 'rotina'): LeituraColetada => ({ id: `l${horasAtras}-${fase}`, ts: AGORA - horasAtras * H, plantaId: 'p1', plantaNome: 'Tomate', sensorCodigo: '001', bruto: 2000, umidade, fase });
/** Leituras a cada 2 h, da mais antiga (10 h atrás) até agora, com a umidade dada por função da hora. */
const serie = (f: (horasAtras: number) => number) => [10, 8, 6, 4, 2, 0].map((h) => leitura(h, f(h)));

describe('avaliarSensor — confiabilidade da leitura', () => {
  const regulares = serie(() => 55);

  it('aceita leitura recente de sensor online', () => {
    const r = avaliarSensor(sensor(), regulares, AGORA);
    expect(r.situacao).toBe('ok');
    expect(r.confiavel).toBe(true);
  });

  it('estima a frequência esperada pela mediana dos intervalos', () => {
    expect(intervaloEsperadoMs('p1', regulares)).toBe(2 * H);
  });

  it('não estima frequência com menos de 3 leituras de rotina', () => {
    expect(intervaloEsperadoMs('p1', [leitura(2, 50), leitura(0, 50)])).toBeNull();
  });

  it('sensor offline não é confiável e informa a última leitura, sem chamá-lo de defeituoso', () => {
    const r = avaliarSensor(sensor({ status: 'offline', ultimaLeituraMs: AGORA - 47 * 60_000 }), regulares, AGORA);
    expect(r.situacao).toBe('offline');
    expect(r.confiavel).toBe(false);
    expect(r.detalhe).toContain('47 min');
    expect(r.detalhe.toLowerCase()).not.toContain('defeit');
  });

  it('leitura sem variação por 12 h ou mais é "possível travamento" (não confirmado)', () => {
    const r = avaliarSensor(sensor({ estavelHoras: 14 }), regulares, AGORA);
    expect(r.situacao).toBe('travada');
    expect(r.detalhe).toContain('não confirmado');
    expect(avaliarSensor(sensor({ estavelHoras: 11 }), regulares, AGORA).situacao).toBe('ok');
  });

  it('valor fora de 0–100% é inválido', () => {
    expect(avaliarSensor(sensor({ valor: 140 }), regulares, AGORA).situacao).toBe('invalida');
    expect(avaliarSensor(sensor({ valor: -3 }), regulares, AGORA).situacao).toBe('invalida');
    expect(avaliarSensor(sensor({ valor: Number.NaN }), regulares, AGORA).situacao).toBe('invalida');
  });

  it('leitura bruta fora da escala da placa é inválida', () => {
    const r = avaliarSensor(sensor({ bruto: 5000, calibracao: { placa: 'esp32', brutoSeco: 3200, brutoMolhado: 1300 } }), regulares, AGORA);
    expect(r.situacao).toBe('invalida');
  });

  it('só considera desatualizada depois de 3× o intervalo esperado (2 h → 6 h)', () => {
    const antigas = [20, 18, 16, 14, 12, 10].map((h) => leitura(h, 55));
    expect(avaliarSensor(sensor(), antigas, AGORA).situacao).toBe('desatualizada'); // última há 10 h
    const quaseLa = [14, 12, 10, 8, 6, 5].map((h) => leitura(h, 55));
    expect(avaliarSensor(sensor(), quaseLa, AGORA).situacao).toBe('ok'); // última há 5 h < 6 h
  });

  it('sem leituras suficientes para estimar a frequência, NÃO acusa desatualização (evidência insuficiente)', () => {
    expect(avaliarSensor(sensor(), [leitura(30, 55)], AGORA).situacao).toBe('ok');
  });

  it('sensor ausente é tratado como sem sensor, não como saudável', () => {
    const r = avaliarSensor(undefined, [], AGORA);
    expect(r.situacao).toBe('ausente');
    expect(r.confiavel).toBe(false);
  });

  it('não afirma horário de comunicação que o sistema não tem', () => {
    expect(ultimaComunicacaoMs(sensor({ tipo: 'temperatura', plantaId: undefined }), regulares)).toBeNull();
    expect(ultimaComunicacaoMs(sensor(), regulares)).toBe(AGORA);
  });
});

describe('estado da planta e alertas usam a mesma regra de confiabilidade', () => {
  const culturas = culturasIniciais;
  const critica = planta({ umidadeAtual: 20 }); // crítica: abaixo do limite configurado

  it('planta crítica com leitura confiável vira "crítico" e gera alerta com valor, limite e ação', () => {
    const leituras = serie(() => 20);
    const m = diagnosticarPlanta(critica, [sensor({ valor: 20 })], leituras, culturas, AGORA);
    expect(m.estado).toBe('critico');
    const alertas = gerarAlertasDeEstado([critica], [sensor({ valor: 20 })], sessoesIniciais, leituras, AGORA);
    const a = alertas.find((x) => x.tipo === 'umidade_critica');
    expect(a).toBeDefined();
    expect(a?.valorAtual).toBe('20%');
    expect(a?.limite).toContain(`${critica.umidadeCritica}%`);
    expect(a?.acao).toBeTruthy();
  });

  it('o mesmo valor crítico com sensor offline vira "sem dados" e NÃO gera alerta de umidade crítica', () => {
    const off = sensor({ status: 'offline', ultimaLeituraMs: AGORA - 90 * 60_000, valor: 20 });
    const leituras = serie(() => 20);
    expect(diagnosticarPlanta(critica, [off], leituras, culturas, AGORA).estado).toBe('sem_dados');
    const alertas = gerarAlertasDeEstado([critica], [off], sessoesIniciais, leituras, AGORA);
    expect(alertas.some((x) => x.tipo === 'umidade_critica')).toBe(false);
    expect(alertas.some((x) => x.tipo === 'sensor_offline')).toBe(true);
  });

  it('leitura desatualizada gera alerta próprio e tira a planta dos indicadores', () => {
    const antigas = [20, 18, 16, 14, 12, 10].map((h) => leitura(h, 20));
    const m = diagnosticarPlanta(critica, [sensor({ valor: 20 })], antigas, culturas, AGORA);
    expect(m.estado).toBe('sem_dados');
    const alertas = gerarAlertasDeEstado([critica], [sensor({ valor: 20 })], sessoesIniciais, antigas, AGORA);
    expect(alertas.map((a) => a.tipo)).toContain('leitura_desatualizada');
    expect(alertas.map((a) => a.tipo)).not.toContain('umidade_critica');
  });

  it('com os dados de exemplo, plantas críticas e alertas de umidade crítica batem (consistência entre as dashboards)', () => {
    const monitoradas = plantasIniciais.map((p) => diagnosticarPlanta(p, sensoresIniciais, leiturasIniciais, culturasIniciais, AGORA));
    const alertas = gerarAlertasDeEstado(plantasIniciais, sensoresIniciais, sessoesIniciais, leiturasIniciais, AGORA);
    const ind = calcularIndicadores(monitoradas, sensoresIniciais, alertas);
    expect(alertas.filter((a) => a.tipo === 'umidade_critica').length).toBe(ind.criticas);
    // Hortelã (sensor travado) e Coentro (offline) ficam fora da média e da contagem de monitoradas.
    expect(ind.semDados).toBe(2);
    expect(ind.plantasComLeitura).toBe(plantasIniciais.length - 2);
  });
});

describe('tendenciaDaPlanta', () => {
  const p = planta({ umidadeAtual: 40, umidadeCritica: 30 });

  it('queda consistente: informa taxa e estimativa de horas até o limite crítico', () => {
    const t = tendenciaDaPlanta(p, serie((h) => 40 + h * 2), AGORA); // sobe 2 p.p. a cada hora para trás => cai 2 p.p./h
    expect(t.direcao).toBe('queda');
    expect(t.taxaPorHora).toBeCloseTo(-2, 5);
    expect(t.horasAteCritico).toBeCloseTo(5, 5); // (40 − 30) / 2
    expect(t.r2).toBeCloseTo(1, 5);
  });

  it('alta consistente não estima limite crítico', () => {
    const t = tendenciaDaPlanta(p, serie((h) => 40 - h), AGORA);
    expect(t.direcao).toBe('alta');
    expect(t.horasAteCritico).toBeNull();
  });

  it('variação mínima é "estável"', () => {
    expect(tendenciaDaPlanta(p, serie(() => 40), AGORA).direcao).toBe('estavel');
  });

  it('oscilação sem direção é inconclusiva e explica o motivo, em vez de inventar previsão', () => {
    const ruido = [38, 52, 35, 55, 36, 50];
    const t = tendenciaDaPlanta(p, [10, 8, 6, 4, 2, 0].map((h, i) => leitura(h, ruido[i])), AGORA);
    expect(t.direcao).toBe('inconclusiva');
    expect(t.horasAteCritico).toBeNull();
    expect(t.limitacao).toBeTruthy();
  });

  it('poucas leituras: inconclusiva', () => {
    const t = tendenciaDaPlanta(p, [leitura(2, 45), leitura(0, 40)], AGORA);
    expect(t.direcao).toBe('inconclusiva');
    expect(t.limitacao).toContain('2 leitura');
  });

  it('leituras de irrigação (antes/durante/depois) não entram na tendência de rotina', () => {
    const misturadas = [...serie(() => 40), leitura(1, 90, 'depois'), leitura(1, 20, 'antes')];
    expect(tendenciaDaPlanta(p, misturadas, AGORA).direcao).toBe('estavel');
  });
});

describe('compararPeriodos', () => {
  const dia = (i: number, extra: Partial<ConsumoDia> = {}): ConsumoDia => ({ data: String(i), ts: i, umidadeMedia: 50, plantasCriticas: 0, alertas: 1, utilizada: 40, convencional: 60, ...extra });
  // 14 dias completos (+ hoje, parcial) : os 7 anteriores com 40 L/dia e os 7 recentes com 50 L/dia
  const consumo = [...Array.from({ length: 7 }, (_, i) => dia(i)), ...Array.from({ length: 7 }, (_, i) => dia(i + 7, { utilizada: 50, umidadeMedia: 55, plantasCriticas: i < 2 ? 1 : 0 })), dia(99, { utilizada: 0 })];

  it('compara os últimos N dias completos com os N anteriores, sem contar hoje', () => {
    const c = compararPeriodos(consumo, 7)!;
    expect(c.aguaUtilizada.atual).toBe(350);
    expect(c.aguaUtilizada.anterior).toBe(280);
    expect(c.aguaUtilizada.variacao).toBe(70);
    expect(c.aguaUtilizada.variacaoPct).toBe(25);
    expect(c.umidadeMedia.variacao).toBe(5);
    expect(c.diasComPlantaCritica.atual).toBe(2);
    expect(c.diasComPlantaCritica.anterior).toBe(0);
    expect(c.diasComPlantaCritica.variacaoPct).toBeNull(); // anterior zero: sem percentual
  });

  it('sem histórico para os dois períodos, devolve null em vez de comparar com o que não existe', () => {
    expect(compararPeriodos(consumo, 14)).toBeNull();
  });
});

describe('ultimasLeituras', () => {
  it('traz o horário real da última leitura e deixa vazio quem não tem registro', () => {
    const linhas = ultimasLeituras(leiturasIniciais, plantasIniciais);
    expect(linhas).toHaveLength(plantasIniciais.length);
    const coentro = linhas.find((l) => l.planta.nome === 'Coentro')!;
    expect(coentro.medicao).toBeNull(); // sensor offline: nenhum registro
    const alface = linhas.find((l) => l.planta.nome === 'Alface')!;
    expect(alface.medicao?.ts).toBe(Math.max(...leiturasIniciais.filter((l) => l.plantaId === '1').map((l) => l.ts)));
  });
});
