import {
  climaInicial,
  consumoInicial,
  culturasIniciais,
  historicoIrrigacaoInicial,
  leiturasIniciais,
  plantasIniciais,
  sensoresIniciais,
  sessoesIniciais,
  TARIFA_AGUA_M3,
} from '../utils/mockData';
import type { EcotechApi, PreferenciasNotificacao, Usuario } from './types';

const CHAVE_USUARIO = 'ecotech-usuario-simulado';

function lerUsuario(): Usuario | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE_USUARIO);
    return bruto ? (JSON.parse(bruto) as Usuario) : null;
  } catch {
    return null;
  }
}

let notificacoes: PreferenciasNotificacao = { horta: true, email: false, sistema: true };

/**
 * Implementação SIMULADA: não usa rede e não envia nada a nenhum equipamento.
 * Qualquer e-mail/senha preenchidos entram; a irrigação é simulada pelo
 * PlantsContext (por isso os comandos aqui não fazem nada).
 */
export const mockEcotechApi: EcotechApi = {
  simulado: true,

  async entrar(email) {
    const usuario: Usuario = { id: 'simulado', nome: email.split('@')[0] || email, email: email.includes('@') ? email : `${email}@ecotech.com` };
    try {
      sessionStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
    } catch {
      // sem storage, a sessão simulada vale até recarregar
    }
    return usuario;
  },

  sair() {
    try {
      sessionStorage.removeItem(CHAVE_USUARIO);
    } catch {
      // ignora
    }
  },

  usuarioAtual: lerUsuario,
  trocarSenha: async () => undefined,
  obterNotificacoes: async () => notificacoes,
  salvarNotificacoes: async (dados) => (notificacoes = { ...notificacoes, ...dados }),

  carregarHorta: async () => ({
    plantas: plantasIniciais,
    sessoes: sessoesIniciais,
    sensores: sensoresIniciais,
    culturas: culturasIniciais,
    historico: historicoIrrigacaoInicial,
    consumo: consumoInicial,
    tarifaM3: TARIFA_AGUA_M3,
    leituras: leiturasIniciais,
  }),
  atualizarPlanta: async () => undefined,
  removerPlanta: async () => undefined,
  criarPlanta: async () => undefined,
  atualizarCultura: async () => undefined,
  ajustarSensor: async () => undefined,
  iniciarIrrigacao: async () => undefined,
  pararIrrigacao: async () => undefined,
  definirModoIrrigacao: async () => undefined,
  obterPrevisaoTempo: async () => climaInicial,
};
