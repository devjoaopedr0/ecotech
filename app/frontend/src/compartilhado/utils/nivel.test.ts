import { describe, expect, it } from 'vitest';
import { ROTAS, ROTAS_BASICO, ROTAS_INTER } from '../../routes/paths';
import { NIVEL_PADRAO, destinoNoNivel, nivelDoConhecimento, nivelSalvo, salvarNivel } from './nivel';

/** O ambiente de teste é Node (sem localStorage): memória simples no lugar do armazenamento do navegador. */
const memoria = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => memoria.get(k) ?? null,
  setItem: (k: string, v: string) => void memoria.set(k, v),
  removeItem: (k: string) => void memoria.delete(k),
};

describe('nível da dashboard', () => {
  it('muita familiaridade com tecnologia -> avançada; média -> intermediária; pouca -> básica', () => {
    expect(nivelDoConhecimento('muito')).toBe('avancado');
    expect(nivelDoConhecimento('medio')).toBe('intermediario');
    expect(nivelDoConhecimento('pouco')).toBe('basico');
  });

  it('sem resposta no cadastro vale o padrão (avançada, como antes)', () => {
    expect(nivelDoConhecimento('')).toBe(NIVEL_PADRAO);
    expect(NIVEL_PADRAO).toBe('avancado');
  });

  it('guarda o nível por usuário, ignorando maiúsculas e espaços', () => {
    memoria.clear();
    expect(nivelSalvo('Maria')).toBe(NIVEL_PADRAO);
    salvarNivel(' Maria ', 'intermediario');
    expect(nivelSalvo('maria')).toBe('intermediario');
    expect(nivelSalvo('joao')).toBe(NIVEL_PADRAO);
    salvarNivel('maria', 'avancado');
    expect(nivelSalvo('MARIA')).toBe('avancado');
    salvarNivel('maria', 'basico');
    expect(nivelSalvo('Maria')).toBe('basico');
  });

  it('ignora valores inválidos no armazenamento', () => {
    memoria.set('ecotech-niveis', JSON.stringify({ ana: 'admin', bia: 'intermediario' }));
    expect(nivelSalvo('ana')).toBe(NIVEL_PADRAO);
    expect(nivelSalvo('bia')).toBe('intermediario');
    memoria.set('ecotech-niveis', '{quebrado');
    expect(nivelSalvo('bia')).toBe(NIVEL_PADRAO);
  });

  it('leva telas do outro nível para a equivalente ou para o início do nível do usuário', () => {
    expect(destinoNoNivel(ROTAS.visaoGeral, 'intermediario')).toBe(ROTAS_INTER.inicio);
    expect(destinoNoNivel(ROTAS.dashboard, 'intermediario')).toBe(ROTAS_INTER.inicio);
    expect(destinoNoNivel(ROTAS.sensores, 'intermediario')).toBe(ROTAS_INTER.inicio);
    expect(destinoNoNivel(ROTAS.plantas, 'intermediario')).toBe(ROTAS_INTER.plantas);
    expect(destinoNoNivel(ROTAS.configuracoes, 'intermediario')).toBe(ROTAS_INTER.configuracoes);
    expect(destinoNoNivel(ROTAS_INTER.inicio, 'avancado')).toBe(ROTAS.visaoGeral);
    expect(destinoNoNivel(ROTAS_INTER.alertas, 'avancado')).toBe(ROTAS.visaoGeral);
    expect(destinoNoNivel(ROTAS_INTER.plantas, 'avancado')).toBe(ROTAS.plantas);
    expect(destinoNoNivel(ROTAS_INTER.configuracoes, 'avancado')).toBe(ROTAS.configuracoes);
  });

  it('o nível básico tem as mesmas equivalências (plantas e configurações) e o resto vai para o início dele', () => {
    expect(destinoNoNivel(ROTAS.visaoGeral, 'basico')).toBe(ROTAS_BASICO.inicio);
    expect(destinoNoNivel(ROTAS.monitor, 'basico')).toBe(ROTAS_BASICO.inicio);
    expect(destinoNoNivel(ROTAS_INTER.irrigacao, 'basico')).toBe(ROTAS_BASICO.inicio);
    expect(destinoNoNivel(ROTAS.plantas, 'basico')).toBe(ROTAS_BASICO.plantas);
    expect(destinoNoNivel(ROTAS_INTER.plantas, 'basico')).toBe(ROTAS_BASICO.plantas);
    expect(destinoNoNivel(ROTAS_INTER.configuracoes, 'basico')).toBe(ROTAS_BASICO.configuracoes);
    expect(destinoNoNivel(ROTAS_BASICO.inicio, 'intermediario')).toBe(ROTAS_INTER.inicio);
    expect(destinoNoNivel(ROTAS_BASICO.plantas, 'avancado')).toBe(ROTAS.plantas);
    expect(destinoNoNivel(ROTAS_BASICO.configuracoes, 'intermediario')).toBe(ROTAS_INTER.configuracoes);
  });

  it('detalhe de planta e barra final também acham a tela equivalente', () => {
    expect(destinoNoNivel(ROTAS_INTER.planta('p1'), 'basico')).toBe(ROTAS_BASICO.plantas);
    expect(destinoNoNivel(ROTAS_INTER.planta('p1'), 'avancado')).toBe(ROTAS.plantas);
    expect(destinoNoNivel(`${ROTAS_INTER.plantas}/`, 'basico')).toBe(ROTAS_BASICO.plantas);
    expect(destinoNoNivel(`${ROTAS.configuracoes}/`, 'intermediario')).toBe(ROTAS_INTER.configuracoes);
  });
});
