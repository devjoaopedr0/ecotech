import type { CadastroForm } from '../../types';
import { NIVEIS } from '../../utils/nivel';

export type CampoCadastro = keyof CadastroForm;
export type ErrosCadastro = Partial<Record<CampoCadastro, string>>;

/** Uma regra recebe o valor do campo (e o formulário inteiro) e devolve a mensagem de erro, ou undefined se estiver ok. */
export type Regra = (valor: string, form: CadastroForm) => string | undefined;

// Regras reutilizáveis.
export const regras = {
  obrigatorio:
    (mensagem = 'Campo obrigatório.'): Regra =>
    (valor) =>
      valor.trim() ? undefined : mensagem,

  email:
    (mensagem = 'Informe um e-mail válido.'): Regra =>
    (valor) =>
      !valor || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim()) ? undefined : mensagem,

  minCaracteres:
    (min: number, mensagem = `Use pelo menos ${min} caracteres.`): Regra =>
    (valor) =>
      !valor || valor.trim().length >= min ? undefined : mensagem,

  padrao:
    (re: RegExp, mensagem: string): Regra =>
    (valor) =>
      !valor || re.test(valor.trim()) ? undefined : mensagem,

  igualA:
    (campo: CampoCadastro, mensagem = 'Os valores não conferem.'): Regra =>
    (valor, form) =>
      valor === form[campo] ? undefined : mensagem,

  umaDasOpcoes:
    (opcoes: readonly string[], mensagem = 'Selecione uma opção.'): Regra =>
    (valor) =>
      opcoes.includes(valor) ? undefined : mensagem,
};

/** Regras aplicadas a cada campo. */
export const regrasCadastro: Record<CampoCadastro, Regra[]> = {
  nome: [regras.obrigatorio('Informe seu nome completo.'), regras.minCaracteres(3, 'Informe seu nome completo.')],
  email: [regras.obrigatorio('Informe seu e-mail.'), regras.email()],
  usuario: [
    regras.obrigatorio('Escolha um nome de usuário.'),
    regras.minCaracteres(3),
    regras.padrao(/^[a-zA-Z0-9._-]+$/, 'Use apenas letras, números, ponto, hífen ou sublinhado (sem espaços).'),
  ],
  senha: [regras.obrigatorio('Crie uma senha.'), regras.minCaracteres(6, 'A senha precisa ter pelo menos 6 caracteres.')],
  confirmarSenha: [regras.obrigatorio('Confirme sua senha.'), regras.igualA('senha', 'As senhas não conferem.')],
  nivel: [regras.umaDasOpcoes(NIVEIS, 'Escolha um nível de visualização.')],
};

/** Campos de cada etapa do cadastro (a validação roda por etapa). */
export const CAMPOS_DADOS: CampoCadastro[] = ['nome', 'email', 'usuario', 'senha', 'confirmarSenha'];
export const CAMPOS_NIVEL: CampoCadastro[] = ['nivel'];

/** Roda as regras de cada campo (ou só dos campos informados) e retorna o primeiro erro encontrado por campo. */
export function validarCadastro(
  form: CadastroForm,
  campos: CampoCadastro[] = Object.keys(regrasCadastro) as CampoCadastro[],
  regrasPorCampo = regrasCadastro
): ErrosCadastro {
  const erros: ErrosCadastro = {};
  for (const campo of campos) {
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
