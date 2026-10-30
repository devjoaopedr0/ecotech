import type { CadastroForm, NivelConhecimentoTecnologia } from '../../types';

export type CampoCadastro = keyof CadastroForm;
export type ErrosCadastro = Partial<Record<CampoCadastro, string>>;

/** Uma regra recebe o valor do campo (e o formulário inteiro) e devolve a mensagem de erro, ou undefined se estiver ok. */
export type Regra = (valor: string, form: CadastroForm) => string | undefined;

export const OPCOES_CONHECIMENTO: { valor: NivelConhecimentoTecnologia; titulo: string; descricao: string }[] = [
  { valor: 'muito', titulo: 'Muito', descricao: 'Uso tecnologia com facilidade no dia a dia.' },
  { valor: 'medio', titulo: 'Médio', descricao: 'Me viro bem, mas às vezes preciso de ajuda.' },
  { valor: 'pouco', titulo: 'Pouco', descricao: 'Tenho pouca familiaridade com tecnologia.' },
];

// Regras reutilizáveis. Ainda não estão em uso, mas já ficam prontas para montar a validação.
export const regras = {
  obrigatorio:
    (mensagem = 'Campo obrigatório.'): Regra =>
    (valor) =>
      valor.trim() ? undefined : mensagem,

  email:
    (mensagem = 'Informe um e-mail válido.'): Regra =>
    (valor) =>
      !valor || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor) ? undefined : mensagem,

  minCaracteres:
    (min: number, mensagem = `Use pelo menos ${min} caracteres.`): Regra =>
    (valor) =>
      !valor || valor.length >= min ? undefined : mensagem,

  igualA:
    (campo: CampoCadastro, mensagem = 'Os valores não conferem.'): Regra =>
    (valor, form) =>
      valor === form[campo] ? undefined : mensagem,

  umaDasOpcoes:
    (opcoes: readonly string[], mensagem = 'Selecione uma opção.'): Regra =>
    (valor) =>
      opcoes.includes(valor) ? undefined : mensagem,
};

/**
 * Regras aplicadas a cada campo. Por enquanto nada é validado.
 * Para ativar, basta preencher as listas, por exemplo:
 *
 *   nome: [regras.obrigatorio('Informe seu nome.')],
 *   email: [regras.obrigatorio(), regras.email()],
 *   senha: [regras.obrigatorio(), regras.minCaracteres(6)],
 *   confirmarSenha: [regras.igualA('senha', 'As senhas não conferem.')],
 *   nivelConhecimento: [regras.umaDasOpcoes(OPCOES_CONHECIMENTO.map((o) => o.valor))],
 */
export const regrasCadastro: Record<CampoCadastro, Regra[]> = {
  nome: [],
  email: [],
  usuario: [],
  senha: [],
  confirmarSenha: [],
  nivelConhecimento: [],
};

/** Roda as regras de cada campo e retorna o primeiro erro encontrado por campo. */
export function validarCadastro(form: CadastroForm, regrasPorCampo = regrasCadastro): ErrosCadastro {
  const erros: ErrosCadastro = {};
  for (const campo of Object.keys(regrasPorCampo) as CampoCadastro[]) {
    for (const regra of regrasPorCampo[campo]) {
      const erro = regra(form[campo], form);
      if (erro) {
        erros[campo] = erro;
        break;
      }
    }
  }
  return erros;
}

export function temErros(erros: ErrosCadastro) {
  return Object.values(erros).some(Boolean);
}
