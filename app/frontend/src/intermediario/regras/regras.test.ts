import { describe, expect, it } from 'vitest';
import type { Alerta, LeituraColetada, Plant, Sensor, SessaoIrrigacao } from '../../compartilhado/types';
import { gerarAlertasDeEstado } from '../../compartilhado/utils/alertas';
import { diagnosticarPlanta } from '../../compartilhado/utils/horta';
import { culturasIniciais, plantasIniciais, sensoresIniciais } from '../../compartilhado/utils/mockData';
import { atividadesRecentes } from './atividades';
import { avaliarAtualizacao } from './atualizacao';
import { montarCentralAtencao } from './central';
import { filtrarPlantas, plantasComAlerta } from './plantas';
import { descreverComando, validarInicioIrrigacao } from '../../compartilhado/utils/irrigacao';
import { gerarRecomendacoes } from './recomendacoes';
import { contarSemaforo, semaforoDaPlanta } from './semaforo';

const H = 3_600_000;
const AGORA = Date.now();

const planta = (extra: Partial<Plant> = {}): Plant => ({ ...plantasIniciais[4], id: 'p1', umidadeAtual: 58, ...extra });
const sensor = (extra: Partial<Sensor> = {}): Sensor => ({ id: 'umi-p1', codigo: '001', nome: 'Sensor #001', tipo: 'umidade', status: 'online', valor: 58, localizacao: 'Teste', plantaId: 'p1', ...extra });
const leitura = (horasAtras: number, umidade: number, fase: LeituraColetada['fase'] = 'rotina'): LeituraColetada => ({ id: `l${horasAtras}-${fase}-${umidade}`, ts: AGORA - horasAtras * H, plantaId: 'p1', plantaNome: 'Tomate', sensorCodigo: '001', bruto: 2000, umidade, fase });
const serie = (f: (h: number) => number) => [10, 8, 6, 4, 2, 0].map((h) => leitura(h, f(h)));
const sessao = (extra: Partial<SessaoIrrigacao> = {}): SessaoIrrigacao => ({ estado: 'desligada', modo: 'automatico', origem: null, decorridoMin: 0, duracaoMin: null, motivo: '', umidadeAntes: 0, bloqueioAuto: false, ...extra });
const monitorar = (p: Plant, s: Sensor[], l: LeituraColetada[]) => diagnosticarPlanta(p, s, l, culturasIniciais, AGORA);

describe('semáforo ambiental', () => {
  it('adequado: umidade nos limites da planta e temperatura na faixa da cultura', () => {
    const m = monitorar(planta(), [sensor()], serie(() => 58));
    expect(semaforoDaPlanta(m)).toMatchObject({ nivel: 'adequado', rotulo: 'Adequado' });
  });

  it('usa os limites de cada planta: a mesma umidade pode ser adequada para uma e atenção para outra', () => {
    const a = monitorar(planta({ umidadeAtual: 42, umidadeMinima: 38, umidadeCritica: 30 }), [sensor({ valor: 42 })], serie(() => 42));
    const b = monitorar(planta({ umidadeAtual: 42, umidadeMinima: 45, umidadeCritica: 30 }), [sensor({ valor: 42 })], serie(() => 42));
    expect(semaforoDaPlanta(a).nivel).toBe('adequado');
    expect(semaforoDaPlanta(b).nivel).toBe('atencao');
  });

  it('crítico: abaixo do limite crítico da planta', () => {
    const m = monitorar(planta({ umidadeAtual: 25 }), [sensor({ valor: 25 })], serie(() => 25));
    expect(semaforoDaPlanta(m).nivel).toBe('critico');
  });

  it('temperatura fora da faixa da cultura leva a atenção, com o motivo', () => {
    const m = monitorar(planta({ temperatura: 40 }), [sensor()], serie(() => 58));
    const s = semaforoDaPlanta(m);
    expect(s.nivel).toBe('atencao');
    expect(s.motivos.join(' ')).toContain('acima da faixa');
  });

  it('dado ausente, offline ou desatualizado nunca é "adequado"', () => {
    const offline = monitorar(planta(), [sensor({ status: 'offline' })], serie(() => 58));
    const semSensor = monitorar(planta(), [], serie(() => 58));
    const antigas = [30, 28, 26, 24, 22].map((h) => leitura(h, 58));
    const desatualizada = monitorar(planta(), [sensor()], antigas);
    expect(semaforoDaPlanta(offline)).toMatchObject({ nivel: 'sem_dados', rotulo: 'Sem dados recentes' });
    expect(semaforoDaPlanta(semSensor)).toMatchObject({ nivel: 'sem_dados', rotulo: 'Sem sensor' });
    expect(semaforoDaPlanta(desatualizada).nivel).toBe('sem_dados');
  });

  it('conta cada nível', () => {
    const lista = [monitorar(planta(), [sensor()], serie(() => 58)), monitorar(planta({ umidadeAtual: 20 }), [sensor({ valor: 20 })], serie(() => 20)), monitorar(planta(), [], [])];
    expect(contarSemaforo(lista)).toEqual({ adequado: 1, atencao: 0, critico: 1, sem_dados: 1 });
  });
});

describe('central de atenção', () => {
  const alerta = (extra: Partial<Alerta>): Alerta => ({ id: 'a', tipo: 'umidade_baixa', severidade: 'atencao', titulo: 'T', mensagem: 'M', criadoEm: 0, ...extra });

  it('ordena por prioridade e depois por relevância, sem repetir o mesmo problema', () => {
    const itens = montarCentralAtencao(
      [
        alerta({ id: 'x1', tipo: 'sensor_offline', plantaId: 'p1' }),
        alerta({ id: 'x2', tipo: 'sensor_offline', plantaId: 'p1' }), // duplicado
        alerta({ id: 'x3', tipo: 'umidade_critica', severidade: 'critico', plantaId: 'p1' }),
        alerta({ id: 'x4', tipo: 'umidade_baixa', plantaId: 'p2' }),
      ],
      [planta(), planta({ id: 'p2' })],
      [],
      {}
    );
    expect(itens.map((i) => i.id)).toEqual(['x3', 'x4', 'x1']);
    expect(itens[0].prioridade).toBe('alta');
  });

  it('ignora eventos informativos e análise de consumo', () => {
    const itens = montarCentralAtencao([alerta({ tipo: 'irrigacao_iniciada', severidade: 'ideal' }), alerta({ id: 'c', tipo: 'consumo_alto' })], [], [], {});
    expect(itens).toEqual([]);
  });

  it('inclui o valor observado, a ação e o horário quando existem; sem horário não inventa um', () => {
    const [item] = montarCentralAtencao([alerta({ valorAtual: '27%', acao: 'Irrigue', criadoEm: AGORA - H })], [], [], {});
    expect(item).toMatchObject({ valorObservado: '27%', acao: 'Irrigue', quando: AGORA - H });
    const [semHora] = montarCentralAtencao([alerta({ criadoEm: 0 })], [], [], {});
    expect(semHora.quando).toBeNull();
  });

  it('só reporta falha de irrigação quando o serviço recusou o comando', () => {
    const base = { acao: 'iniciar', origem: 'manual', enviadoEm: AGORA } as const;
    expect(montarCentralAtencao([], [planta()], [], { p1: { ...base, situacao: 'enviando' } })).toEqual([]);
    expect(montarCentralAtencao([], [planta()], [], { p1: { ...base, situacao: 'enviado' } })).toEqual([]);
    expect(montarCentralAtencao([], [planta()], [], { p1: { ...base, situacao: 'falhou' } })).toHaveLength(1);
  });

  it('com os dados de exemplo, não repete alertas e não trata sensor desatualizado como defeituoso', () => {
    const leituras: LeituraColetada[] = [];
    const alertas = gerarAlertasDeEstado(plantasIniciais, sensoresIniciais, {}, leituras, AGORA);
    const itens = montarCentralAtencao(alertas, plantasIniciais, sensoresIniciais, {});
    expect(new Set(itens.map((i) => i.id)).size).toBe(itens.length);
    expect(itens.map((i) => `${i.titulo} ${i.descricao}`.toLowerCase()).join(' ')).not.toContain('defeit');
  });
});

describe('recomendações', () => {
  const rec = (p: Plant, s: Sensor[], l: LeituraColetada[], ses = sessao()) => gerarRecomendacoes([monitorar(p, s, l)], () => ses, l, AGORA);

  it('nada a recomendar quando tudo está estável e dentro dos limites', () => {
    expect(rec(planta(), [sensor()], serie(() => 58))).toEqual([]);
  });

  it('modo manual com solo abaixo do mínimo: avisa que a irrigação não começa sozinha e leva à irrigação', () => {
    const [r] = rec(planta({ umidadeAtual: 35 }), [sensor({ valor: 35 })], serie(() => 35), sessao({ modo: 'manual' }));
    expect(r).toMatchObject({ destino: 'irrigacao', plantaId: 'p1' });
    expect(r.porQue).toContain('modo manual');
  });

  it('modo automático com solo baixo não gera recomendação duplicada (o alerta já cobre)', () => {
    expect(rec(planta({ umidadeAtual: 35 }), [sensor({ valor: 35 })], serie(() => 35))).toEqual([]);
  });

  it('queda medida: estima o tempo até o limite crítico e diz que é estimativa', () => {
    // 58% -> 49% em 10 h (≈ -0,9 p.p./h); crítico 30%... mais perto: crítica 45%
    const [r] = rec(planta({ umidadeAtual: 49, umidadeCritica: 45, umidadeMinima: 46 }), [sensor({ valor: 49 })], serie((h) => 49 + h * 0.9));
    expect(r.id).toBe('queda-p1');
    expect(r.porQue).toContain('estimativa');
  });

  it('não conclui tendência com poucas leituras', () => {
    expect(rec(planta({ umidadeAtual: 49 }), [sensor({ valor: 49 })], [leitura(2, 55), leitura(0, 49)])).toEqual([]);
  });

  it('mudança relevante de umidade sugere consultar a planta', () => {
    const [r] = rec(planta(), [sensor()], serie((h) => (h > 4 ? 40 : 58)));
    expect(r.id).toBe('mudanca-p1');
    expect(r.destino).toBe('planta');
  });

  it('planta sem sensor é identificada', () => {
    const [r] = rec(planta(), [], []);
    expect(r.id).toBe('sem-sensor-p1');
  });
});

describe('histórico recente', () => {
  it('detecta mudanças de estado da umidade nas leituras de rotina, com horário', () => {
    const p = planta({ umidadeAtual: 25 });
    const eventos = atividadesRecentes([p], [leitura(4, 58), leitura(2, 35), leitura(0, 25)], [], []);
    expect(eventos.map((e) => e.titulo)).toEqual(['Umidade ficou crítica', 'Umidade saiu da faixa']);
    expect(eventos[0].ts).toBe(AGORA);
  });

  it('não gera evento quando o estado não muda e não inventa eventos de sensor', () => {
    expect(atividadesRecentes([planta()], serie(() => 58), [], [])).toEqual([]);
  });

  it('inclui irrigações iniciadas e concluídas (sem duplicar a conclusão) em ordem decrescente', () => {
    const alertas: Alerta[] = [
      { id: 'ini', tipo: 'irrigacao_iniciada', severidade: 'ideal', titulo: 'Irrigação iniciada', mensagem: 'm', criadoEm: AGORA - 10 * 60_000, plantaId: 'p1' },
      { id: 'fim', tipo: 'irrigacao_concluida', severidade: 'ideal', titulo: 'Irrigação concluída', mensagem: 'm', criadoEm: AGORA - 5 * 60_000, plantaId: 'p1' },
    ];
    const historico = [{ id: 'reg', plantaId: 'p1', plantaNome: 'Tomate', canteiro: 'C1', timestamp: AGORA - 5 * 60_000, duracaoMin: 5, modo: 'manual' as const, motivo: '', litros: 10, umidadeAntes: 30, umidadeDepois: 41 }];
    const eventos = atividadesRecentes([planta()], [], historico, alertas);
    expect(eventos.map((e) => e.id)).toEqual(['reg', 'ini']);
  });
});

describe('atualização dos dados', () => {
  it('leituras recentes: dados atuais', () => {
    expect(avaliarAtualizacao([planta()], serie(() => 58), AGORA)).toMatchObject({ desatualizado: false, aviso: null });
  });

  it('leituras antigas: avisa que os dados podem estar desatualizados', () => {
    const r = avaliarAtualizacao([planta()], serie(() => 58), AGORA + 8 * H);
    expect(r.desatualizado).toBe(true);
    expect(r.aviso).toContain('podem não refletir');
  });

  it('sem leituras: não apresenta valor como atual', () => {
    expect(avaliarAtualizacao([planta()], [], AGORA)).toMatchObject({ ultimaMs: null, desatualizado: true });
  });

  it('com poucas leituras para estimar o intervalo, só informa o horário (não afirma desatualização)', () => {
    expect(avaliarAtualizacao([planta()], [leitura(20, 58)], AGORA)).toMatchObject({ desatualizado: false, limiteMs: null });
  });
});

describe('controle de irrigação', () => {
  const nivel = (valor: number, status: Sensor['status'] = 'online'): Sensor => ({ id: 'niv-1', codigo: '001', nome: 'Nível', tipo: 'nivel_agua', status, valor, localizacao: 'Reservatório' });
  const m = (p: Plant) => monitorar(p, [sensor()], serie(() => p.umidadeAtual));

  it('permite iniciar com reservatório suficiente', () => {
    expect(validarInicioIrrigacao(planta(), m(planta()), sessao(), [sensor(), nivel(46)])).toEqual({ permitido: true, avisos: [] });
  });

  it('bloqueia com irrigação em andamento, comando em envio ou reservatório baixo', () => {
    expect(validarInicioIrrigacao(planta(), m(planta()), sessao({ estado: 'ligada' }), []).permitido).toBe(false);
    expect(validarInicioIrrigacao(planta(), m(planta()), sessao(), [], { acao: 'iniciar', origem: 'manual', enviadoEm: AGORA, situacao: 'enviando' }).permitido).toBe(false);
    const r = validarInicioIrrigacao(planta(), m(planta()), sessao(), [nivel(12)]);
    expect(r.permitido).toBe(false);
    expect(r.bloqueio).toContain('Reabasteça');
  });

  it('avisa (sem bloquear) com solo encharcado, sem leitura confiável ou reservatório sem leitura', () => {
    const molhado = planta({ umidadeAtual: 90 });
    expect(validarInicioIrrigacao(molhado, m(molhado), sessao(), [])).toMatchObject({ permitido: true, avisos: [expect.stringContaining('encharcar')] });
    expect(validarInicioIrrigacao(planta(), undefined, sessao(), [])).toMatchObject({ permitido: true, avisos: [expect.stringContaining('leitura confiável')] });
    expect(validarInicioIrrigacao(planta(), m(planta()), sessao(), [nivel(46, 'offline')]).avisos[0]).toContain('indisponível');
  });

  it('comando enviado não é declarado como execução confirmada', () => {
    const c = { acao: 'iniciar', origem: 'manual', enviadoEm: AGORA, situacao: 'enviado' } as const;
    expect(descreverComando(c, false).texto).toContain('ainda não confirmou');
    expect(descreverComando(c, true).texto).toContain('nenhum equipamento físico foi acionado');
    expect(descreverComando({ ...c, situacao: 'falhou' }, false).situacao).toBe('falhou');
  });
});

describe('busca e filtros', () => {
  const lista = [monitorar(planta({ id: 'p1', nome: 'Manjericão' }), [sensor()], serie(() => 58)), monitorar(planta({ id: 'p2', nome: 'Alface', umidadeAtual: 20 }), [sensor({ id: 'umi-p2', plantaId: 'p2', valor: 20, status: 'offline' })], [])];

  it('busca por nome ignorando acentos e maiúsculas', () => {
    expect(filtrarPlantas(lista, 'MANJERICAO', 'todas', new Set()).map((m) => m.planta.id)).toEqual(['p1']);
  });

  it('filtra por atenção, alertas e sem dados', () => {
    expect(filtrarPlantas(lista, '', 'atencao', new Set())).toHaveLength(0);
    expect(filtrarPlantas(lista, '', 'sem_dados', new Set()).map((m) => m.planta.id)).toEqual(['p2']);
    expect(filtrarPlantas(lista, '', 'alertas', new Set(['p1'])).map((m) => m.planta.id)).toEqual(['p1']);
    expect(plantasComAlerta([{ id: 'a', tipo: 'umidade_baixa', severidade: 'atencao', titulo: '', mensagem: '', criadoEm: 0, plantaId: 'p9' }, { id: 'b', tipo: 'irrigacao_iniciada', severidade: 'ideal', titulo: '', mensagem: '', criadoEm: 1, plantaId: 'p8' }])).toEqual(new Set(['p9']));
  });
});
