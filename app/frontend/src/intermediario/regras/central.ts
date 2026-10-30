import type { Alerta, Plant, PlantStatus, Sensor } from '../../compartilhado/types';
import type { ComandoIrrigacaoRegistro } from '../../compartilhado/context/PlantsContext';
import { alertaRequerAcao, prioridadeDoAlerta, type Prioridade } from '../../compartilhado/utils/horta';

/** Uma ocorrência da Central de atenção, já com tudo que o usuário precisa para agir. */
export interface ItemCentral {
  id: string;
  severidade: PlantStatus;
  prioridade: Prioridade;
  titulo: string;
  descricao: string;
  /** Quando a ocorrência começou (ms); null quando o sistema não registra o início (condição ativa agora). */
  quando: number | null;
  planta?: Plant;
  /** Nome do sensor/dispositivo envolvido, quando houver. */
  dispositivo?: string;
  /** O que foi observado (ex.: "27%"). */
  valorObservado?: string;
  limite?: string;
  acao?: string;
}

/** Análise de custo/consumo é assunto da avançada; não é ação do dia a dia. */
const TIPOS_FORA_DA_CENTRAL = new Set<Alerta['tipo']>(['consumo_alto']);

/** Mais relevante primeiro dentro da mesma gravidade: risco às plantas > água > sensores > demais. */
const PESO_TIPO: Partial<Record<Alerta['tipo'], number>> = {
  umidade_critica: 0,
  reservatorio_baixo: 1,
  umidade_baixa: 2,
  umidade_alta: 3,
  estresse_hidrico: 4,
  temperatura_elevada: 5,
  irrigacao_incomum: 6,
  sensor_offline: 7,
  leitura_invalida: 8,
  sensor_travado: 9,
  leitura_desatualizada: 10,
};
const PESO_FALHA_IRRIGACAO = 1.5;

const ORDEM_SEVERIDADE: Record<PlantStatus, number> = { critico: 0, abaixo: 1, atencao: 2, ideal: 3 };

/** O id do alerta de sensor é "<prefixo>-<id do sensor>" (ex.: "off-umi-8"). */
const sensorDoAlerta = (a: Alerta, sensores: Sensor[]) => {
  const id = a.id.slice(a.id.indexOf('-') + 1);
  return sensores.find((s) => s.id === id);
};

export function montarCentralAtencao(
  alertas: Alerta[],
  plantas: Plant[],
  sensores: Sensor[],
  comandos: Record<string, ComandoIrrigacaoRegistro>
): ItemCentral[] {
  const vistos = new Set<string>();
  const itens: (ItemCentral & { peso: number })[] = [];

  for (const a of alertas) {
    if (!alertaRequerAcao(a) || TIPOS_FORA_DA_CENTRAL.has(a.tipo)) continue;
    // Um mesmo problema (tipo + planta/dispositivo) aparece uma vez só.
    const chave = `${a.tipo}|${a.plantaId ?? a.id}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    const sensor = a.tipo === 'umidade_critica' || a.tipo === 'umidade_baixa' || a.tipo === 'umidade_alta' ? undefined : sensorDoAlerta(a, sensores);
    itens.push({
      id: a.id,
      severidade: a.severidade,
      prioridade: prioridadeDoAlerta(a.severidade),
      titulo: a.titulo,
      descricao: a.mensagem,
      quando: a.criadoEm > 0 ? a.criadoEm : null,
      planta: a.plantaId ? plantas.find((p) => p.id === a.plantaId) : undefined,
      dispositivo: sensor?.nome,
      valorObservado: a.valorAtual,
      limite: a.limite,
      acao: a.acao,
      peso: PESO_TIPO[a.tipo] ?? 11,
    });
  }

  // Falha confirmada: o serviço recusou o comando. Comando pendente ou aceito não é falha.
  for (const [plantaId, c] of Object.entries(comandos)) {
    if (c.situacao !== 'falhou') continue;
    const planta = plantas.find((p) => p.id === plantaId);
    if (!planta) continue;
    itens.push({
      id: `falha-irrigacao-${plantaId}`,
      severidade: 'atencao',
      prioridade: 'media',
      titulo: 'Falha ao enviar comando de irrigação',
      descricao: `O comando para ${c.acao === 'iniciar' ? 'iniciar' : 'parar'} a irrigação de ${planta.nome} não foi aceito pelo serviço. A irrigação pode não estar no estado exibido.`,
      quando: c.enviadoEm,
      planta,
      valorObservado: 'Comando recusado',
      acao: 'Verifique a conexão com o controlador e tente novamente na página Irrigação.',
      peso: PESO_FALHA_IRRIGACAO,
    });
  }

  return itens
    .sort((a, b) => ORDEM_SEVERIDADE[a.severidade] - ORDEM_SEVERIDADE[b.severidade] || a.peso - b.peso || (b.quando ?? 0) - (a.quando ?? 0) || a.titulo.localeCompare(b.titulo, 'pt-BR'))
    .map(({ peso: _peso, ...item }) => item);
}
