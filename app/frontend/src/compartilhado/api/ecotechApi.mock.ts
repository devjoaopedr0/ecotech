import type { EcotechApi } from './types';
import type { UsuarioCadastrado } from '../types';
import { ApiError } from './client';
import { climaInicial, consumoInicial, culturasIniciais, historicoIrrigacaoInicial, plantasIniciais, sensoresIniciais } from '../utils/mockData';

/** Contas criadas sem backend: ficam no navegador (sem senha, que nunca é guardada aqui). */
const CHAVE_USUARIOS = 'ecotech-usuarios';

function lerUsuarios(): UsuarioCadastrado[] {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_USUARIOS) ?? '[]');
    return Array.isArray(bruto) ? (bruto as UsuarioCadastrado[]) : [];
  } catch {
    return [];
  }
}

const mesmoTexto = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Implementação SIMULADA: não usa rede e não envia nada a nenhum equipamento. */
export const mockEcotechApi: EcotechApi = {
  listarPlantas: async () => plantasIniciais,
  listarSensores: async () => sensoresIniciais,
  listarHistoricoIrrigacao: async () => historicoIrrigacaoInicial,
  listarConsumoAgua: async () => consumoInicial,
  obterPrevisaoTempo: async () => climaInicial,
  listarCulturas: async () => Object.values(culturasIniciais),
  salvarCalibracao: async () => undefined,
  enviarComandoIrrigacao: async () => undefined,
  cadastrarUsuario: async ({ nome, email, usuario, nivel }) => {
    const usuarios = lerUsuarios();
    if (usuarios.some((u) => mesmoTexto(u.usuario, usuario)))
      throw new ApiError(409, 'Usuário já cadastrado.', { campo: 'usuario', mensagem: 'Este usuário já está em uso.' });
    if (usuarios.some((u) => mesmoTexto(u.email, email)))
      throw new ApiError(409, 'E-mail já cadastrado.', { campo: 'email', mensagem: 'Este e-mail já está cadastrado.' });
    const conta: UsuarioCadastrado = { nome: nome.trim(), email: email.trim(), usuario: usuario.trim(), nivel };
    try {
      localStorage.setItem(CHAVE_USUARIOS, JSON.stringify([...usuarios, conta]));
    } catch {
      throw new ApiError(0, 'Não foi possível salvar a conta neste navegador.');
    }
    return conta;
  },
};
