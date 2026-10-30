import { describe, expect, it } from 'vitest';
import type { ComandoIrrigacaoRegistro } from '../../compartilhado/context/PlantsContext';
import type { LeituraColetada, Plant, Sensor } from '../../compartilhado/types';
import { diagnosticarPlanta } from '../../compartilhado/utils/horta';
import { culturasIniciais, plantasIniciais } from '../../compartilhado/utils/mockData';
import { estadoSimples, resumoBasico, retornoDaRega, tarefasDoDia } from './simples';

const H = 3_600_000;
const AGORA = Date.now();

const planta = (extra: Partial<Plant> = {}): Plant => ({ ...plantasIniciais[4], id: 'p1', nome: 'Tomate', umidadeAtual: 58, ...extra });
const sensor = (extra: Partial<Sensor> = {}): Sensor => ({ id: 'umi-p1', codigo: '001', nome: 'Sensor #001', tipo: 'umidade', status: 'online', valor: 58, localizacao: 'Teste', plantaId: 'p1', ...extra });
const reservatorio = (extra: Partial<Sensor> = {}): Sensor => ({ id: 'res', codigo: 'R1', nome: 'Reservatório', tipo: 'nivel_agua', status: 'online', valor: 80, localizacao: 'Teste', ...extra });
const serie = (umidade: number, plantaId = 'p1'): LeituraColetada[] =>
  [10, 8, 6, 4, 2, 0].map((h) => ({ id: `${plantaId}-${h}`, ts: AGORA - h * H, plantaId, plantaNome: 'Tomate', sensorCodigo: '001', bruto: 2000, umidade, fase: 'rotina' }));
const monitorar = (p: Plant, s: Sensor[], l: LeituraColetada[]) => diagnosticarPlanta(p, s, l, culturasIniciais, AGORA);
const comUmidade = (u: number) => monitorar(planta({ umidadeAtual: u }), [sensor({ valor: u })], serie(u));
const nunca = () => false;

describe('estado simples da planta', () => {
  it('traduz o diagnóstico para quatro estados sem termos técnicos', () => {
    expect(estadoSimples(comUmidade(58))).toMatchObject({ estado: 'bem', urgente: false });
    expect(estadoSimples(comUmidade(25))).toMatchObject({ estado: 'seca', urgente: true });
    expect(estadoSimples(comUmidade(planta().umidadeMinima - 1))).toMatchObject({ estado: 'seca', urgente: false });
    expect(estadoSimples(comUmidade(planta().umidadeMaxima + 1))).toMatchObject({ estado: 'molhada', urgente: false });
  });

  it('sem leitura confiável é "sem informação", nunca "está bem"', () => {
    expect(estadoSimples(monitorar(planta(), [sensor({ status: 'offline' })], serie(58))).estado).toBe('sem_info');
    expect(estadoSimples(monitorar(planta(), [], serie(58)))).toMatchObject({ estado: 'sem_info', frase: 'Esta planta ainda não tem sensor.' });
  });
});

describe('o que fazer agora', () => {
  it('planta bem não gera tarefa', () => {
    expect(tarefasDoDia([comUmidade(58)], [reservatorio()], nunca)).toEqual([]);
  });

  it('pede rega (agora ou hoje), avisa terra encharcada e sensor sem informação', () => {
    const textos = (u: number) => tarefasDoDia([comUmidade(u)], [], nunca).map((t) => t.texto);
    expect(textos(25)).toEqual(['Regue Tomate agora']);
    expect(textos(planta().umidadeMinima - 1)).toEqual(['Regue Tomate hoje']);
    expect(textos(planta().umidadeMaxima + 1)).toEqual(['Não regue Tomate por enquanto']);
    expect(tarefasDoDia([monitorar(planta(), [sensor({ status: 'offline' })], serie(58))], [], nunca)[0].texto).toBe('Verifique o sensor de Tomate');
  });

  it('não pede rega de planta que já está sendo regada', () => {
    expect(tarefasDoDia([comUmidade(25)], [], () => true)).toEqual([]);
  });

  it('terra encharcada com a água ligada pede para parar a rega (urgente)', () => {
    expect(tarefasDoDia([comUmidade(planta().umidadeMaxima + 1)], [], () => true)).toMatchObject([{ texto: 'Pare de regar Tomate', urgente: true }]);
  });

  it('reservatório quase vazio é urgente; sem leitura do reservatório pede conferência', () => {
    expect(tarefasDoDia([], [reservatorio({ valor: 10 })], nunca)).toMatchObject([{ id: 'reservatorio', urgente: true }]);
    expect(tarefasDoDia([], [reservatorio({ status: 'offline' })], nunca)).toMatchObject([{ id: 'reservatorio', urgente: false }]);
  });

  it('urgentes primeiro', () => {
    const encharcada = monitorar(planta({ id: 'p2', nome: 'Alface', umidadeAtual: 99 }), [sensor({ id: 'umi-p2', plantaId: 'p2', valor: 99 })], serie(99, 'p2'));
    const lista = tarefasDoDia([encharcada, comUmidade(25)], [], nunca);
    expect(lista.map((t) => t.urgente)).toEqual([true, false]);
  });
});

describe('resumo da horta', () => {
  const tarefa = (urgente: boolean) => ({ id: String(Math.random()), texto: 't', detalhe: 'd', urgente });

  it('diz se está tudo bem, se há algo para conferir ou algo urgente', () => {
    expect(resumoBasico(3, [])).toMatchObject({ nivel: 'ok', titulo: 'Está tudo bem com sua horta' });
    expect(resumoBasico(3, [tarefa(false)])).toMatchObject({ nivel: 'atencao', texto: '1 coisa para conferir.' });
    expect(resumoBasico(3, [tarefa(true), tarefa(true), tarefa(false)])).toMatchObject({ nivel: 'critico', texto: '2 coisas para fazer agora.' });
    expect(resumoBasico(0, []).titulo).toBe('Nenhuma planta cadastrada');
  });
});

describe('retorno do botão de regar', () => {
  const comando = (situacao: ComandoIrrigacaoRegistro['situacao']): ComandoIrrigacaoRegistro => ({ acao: 'iniciar', origem: 'manual', enviadoEm: AGORA, situacao });

  it('falha e envio têm prioridade sobre o estado', () => {
    expect(retornoDaRega(true, comando('falhou'), true)?.situacao).toBe('falhou');
    expect(retornoDaRega(false, comando('enviando'), false)?.situacao).toBe('enviando');
  });

  it('fora da simulação, pedido enviado não é apresentado como confirmado', () => {
    expect(retornoDaRega(true, comando('enviado'), false)?.texto).toContain('Esperando o equipamento confirmar');
    expect(retornoDaRega(true, comando('enviado'), true)?.texto).toContain('simulação');
    expect(retornoDaRega(false, undefined, true)).toBeNull();
  });
});
