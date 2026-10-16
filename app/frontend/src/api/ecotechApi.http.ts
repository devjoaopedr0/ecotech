import { climaInicial } from '../utils/mockData';
import { requisitar } from './client';
import type { AuthResponseDto, CollectedReadingDto, CropDto, DeviceDto, IrrigationEventDto, NotificationPreferenceDto, PlantDto, WaterReportDto } from './dto';
import { ENDPOINTS } from './endpoints';
import { consumoDe, culturaDe, culturaParaDto, leiturasDe, plantaDe, plantaParaDto, registroDe, sensoresDe, sessaoDe } from './mappers';
import { limparSessao, salvarSessao, sessaoAtual } from './session';
import type { EcotechApi, PreferenciasNotificacao } from './types';

const DIA_MS = 24 * 60 * 60 * 1000;
/** Janela carregada para histórico de irrigação e consumo. */
const DIAS_HISTORICO = 30;
/** Janela carregada para a coleta de dados (leituras brutas). */
const HORAS_LEITURAS = 12;

const fusoLocal = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

function inicioDoDiaHa(dias: number): Date {
  const d = new Date(Date.now() - dias * DIA_MS);
  d.setHours(0, 0, 0, 0);
  return d;
}

const notificacoesDe = (p: NotificationPreferenceDto): PreferenciasNotificacao => ({ horta: p.garden, email: p.email, sistema: p.system });

/** Implementação real (REST). Só é usada quando VITE_API_URL está definido. */
export const httpEcotechApi: EcotechApi = {
  simulado: false,

  async entrar(email, senha) {
    const dados = await requisitar<AuthResponseDto>(ENDPOINTS.login, {
      metodo: 'POST',
      corpo: { email, password: senha },
      autenticado: false,
    });
    const usuario = { id: dados.user.id, nome: dados.user.name, email: dados.user.email };
    salvarSessao({ accessToken: dados.accessToken, refreshToken: dados.refreshToken, usuario });
    return usuario;
  },

  sair: limparSessao,

  usuarioAtual: () => sessaoAtual()?.usuario ?? null,

  async trocarSenha(senhaAtual, novaSenha) {
    // O backend encerra as outras sessões e devolve tokens novos para esta.
    const dados = await requisitar<AuthResponseDto>(ENDPOINTS.senha, {
      metodo: 'PATCH',
      corpo: { currentPassword: senhaAtual, newPassword: novaSenha },
    });
    const usuario = { id: dados.user.id, nome: dados.user.name, email: dados.user.email };
    salvarSessao({ accessToken: dados.accessToken, refreshToken: dados.refreshToken, usuario });
  },

  obterNotificacoes: async () => notificacoesDe(await requisitar<NotificationPreferenceDto>(ENDPOINTS.notificacoes)),

  async salvarNotificacoes(d) {
    const corpo = { garden: d.horta, email: d.email, system: d.sistema };
    return notificacoesDe(await requisitar<NotificationPreferenceDto>(ENDPOINTS.notificacoes, { metodo: 'PATCH', corpo }));
  },

  async carregarHorta() {
    const agora = new Date();
    const desde = inicioDoDiaHa(DIAS_HISTORICO - 1).toISOString();
    const ate = new Date(agora.getTime() + 60_000).toISOString();
    const [plantas, dispositivos, culturas, ciclos, consumo, leituras] = await Promise.all([
      requisitar<PlantDto[]>(ENDPOINTS.plantas),
      requisitar<DeviceDto[]>(ENDPOINTS.dispositivos),
      requisitar<CropDto[]>(ENDPOINTS.culturas),
      requisitar<IrrigationEventDto[]>(ENDPOINTS.irrigacoes, { consulta: { from: desde, to: ate, limit: 200 } }),
      requisitar<WaterReportDto>(ENDPOINTS.consumoAgua, { consulta: { from: desde, to: ate, tz: fusoLocal() } }),
      requisitar<CollectedReadingDto[]>(ENDPOINTS.leituras, {
        consulta: { from: new Date(agora.getTime() - HORAS_LEITURAS * 3_600_000).toISOString(), to: ate, limit: 1000 },
      }),
    ]);

    const modelos = plantas.map(plantaDe);
    return {
      plantas: modelos,
      sessoes: Object.fromEntries(plantas.map((p) => [p.id, sessaoDe(p, agora.getTime())])),
      sensores: dispositivos.flatMap((d) => sensoresDe(d, modelos)),
      culturas: Object.fromEntries(culturas.map((c) => [c.id, culturaDe(c)])),
      historico: ciclos.flatMap((c) => registroDe(c) ?? []),
      consumo: consumoDe(consumo),
      tarifaM3: consumo.tariffPerM3,
      leituras: leiturasDe(leituras, ciclos),
    };
  },

  async atualizarPlanta(plantaId, dados) {
    await requisitar(ENDPOINTS.planta(plantaId), { metodo: 'PATCH', corpo: plantaParaDto(dados) });
  },

  async removerPlanta(plantaId) {
    await requisitar(ENDPOINTS.planta(plantaId), { metodo: 'DELETE' });
  },

  async criarPlanta(dados) {
    await requisitar(ENDPOINTS.plantas, { metodo: 'POST', corpo: plantaParaDto(dados) });
  },

  async atualizarCultura(culturaId, dados) {
    await requisitar(ENDPOINTS.cultura(culturaId), { metodo: 'PATCH', corpo: culturaParaDto(dados) });
  },

  async ajustarSensor(sensor, { calibracao, profundidadeCm, posicao }) {
    if (!sensor.dispositivoId) throw new Error(`Sensor ${sensor.id} não está ligado a uma placa.`);
    if (calibracao) {
      await requisitar(ENDPOINTS.calibracao(sensor.dispositivoId), {
        metodo: 'PUT',
        corpo: { board: calibracao.placa === 'arduino' ? 'ARDUINO' : 'ESP32', rawDry: calibracao.brutoSeco, rawWet: calibracao.brutoMolhado },
      });
    }
    if (profundidadeCm !== undefined || posicao !== undefined) {
      await requisitar(ENDPOINTS.dispositivo(sensor.dispositivoId), { metodo: 'PATCH', corpo: { depthCm: profundidadeCm, position: posicao } });
    }
  },

  async iniciarIrrigacao(plantaId, duracaoMin) {
    await requisitar(ENDPOINTS.irrigacao(plantaId), { metodo: 'POST', corpo: { on: true, ...(duracaoMin ? { durationMin: duracaoMin } : {}) } });
  },

  async pararIrrigacao(plantaId) {
    await requisitar(ENDPOINTS.irrigacao(plantaId), { metodo: 'POST', corpo: { on: false } });
  },

  async definirModoIrrigacao(plantaId, modo) {
    await requisitar(ENDPOINTS.irrigacao(plantaId), { metodo: 'PATCH', corpo: { mode: modo === 'automatico' ? 'AUTO' : 'MANUAL' } });
  },

  // TODO backend: integrar um serviço meteorológico (ex.: Open-Meteo) pela localização da horta.
  obterPrevisaoTempo: async () => climaInicial,
};
