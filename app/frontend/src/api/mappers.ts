/**
 * Conversões entre os DTOs do backend (inglês, ISO 8601) e os modelos das
 * telas (`src/types`). É o único lugar que conhece os dois formatos.
 */
import type { ConsumoDia, Cultura, FaseLeitura, LeituraColetada, Plant, RegistroIrrigacao, Sensor, SensorTipo, SessaoIrrigacao } from '../types';
import { idSensorUmidade } from '../utils/calibracao';
import { formatarData, formatarDataHora } from '../utils/format';
import type { CollectedReadingDto, CropDto, DeviceDto, IrrigationEventDto, PlantDto, PlantInputDto, WaterReportDto } from './dto';
import type { DadosPlanta } from './types';

const ms = (iso: string) => new Date(iso).getTime();

export function plantaDe(p: PlantDto): Plant {
  return {
    id: p.id,
    nome: p.name,
    tipo: p.species ?? '',
    emoji: p.emoji,
    // Sem leitura ainda, mostra o início da faixa ideal (status Normal) em vez
    // de 0%, que dispararia alertas falsos de umidade crítica.
    umidadeAtual: Math.round(p.latestReading?.humidity ?? p.idealMin),
    faixaMin: p.idealMin,
    faixaMax: p.idealMax,
    umidadeMinima: p.humidityLow,
    umidadeMaxima: p.humidityHigh,
    umidadeCritica: p.humidityCritical,
    temperatura: p.temperature ?? 0,
    canteiro: p.bed ?? '',
    local: p.location ?? '',
    culturaId: p.cropId ?? '',
    dataPlantio: p.plantedAt ?? '',
    taxaSecagemHora: p.dryingRatePerHour ?? 0,
    dataCadastro: formatarData(ms(p.createdAt)),
    ultimaIrrigacao: p.irrigation.lastIrrigationAt ? formatarDataHora(ms(p.irrigation.lastIrrigationAt)) : '--',
  };
}

export function sessaoDe(p: PlantDto, agora = Date.now()): SessaoIrrigacao {
  const ciclo = p.irrigation.currentCycle;
  return {
    estado: p.irrigation.isOn ? 'ligada' : 'desligada',
    modo: p.irrigation.mode === 'AUTO' ? 'automatico' : 'manual',
    origem: ciclo ? (ciclo.source === 'AUTO' ? 'automatica' : 'manual') : null,
    decorridoMin: ciclo ? Math.max(0, Math.floor((agora - ms(ciclo.startedAt)) / 60_000)) : 0,
    duracaoMin: ciclo?.plannedDurationMin ?? null,
    motivo: ciclo?.reason ?? '',
    umidadeAntes: ciclo?.humidityBefore ?? 0,
    bloqueioAuto: p.irrigation.autoBlocked,
  };
}

/** Só os campos enviados viram campos do DTO (PATCH parcial). */
export function plantaParaDto(d: DadosPlanta): PlantInputDto {
  const dto: PlantInputDto = {};
  if (d.nome !== undefined) dto.name = d.nome;
  if (d.tipo !== undefined) dto.species = d.tipo;
  if (d.emoji !== undefined) dto.emoji = d.emoji;
  if (d.canteiro !== undefined) dto.bed = d.canteiro;
  if (d.local !== undefined) dto.location = d.local;
  if (d.culturaId !== undefined) dto.cropId = d.culturaId || null;
  if (d.dataPlantio !== undefined) dto.plantedAt = d.dataPlantio || null;
  if (d.umidadeCritica !== undefined) dto.humidityCritical = d.umidadeCritica;
  if (d.umidadeMinima !== undefined) dto.humidityLow = d.umidadeMinima;
  if (d.faixaMin !== undefined) dto.idealMin = d.faixaMin;
  if (d.faixaMax !== undefined) dto.idealMax = d.faixaMax;
  if (d.umidadeMaxima !== undefined) dto.humidityHigh = d.umidadeMaxima;
  return dto;
}

export function culturaDe(c: CropDto): Cultura {
  return {
    id: c.id,
    nome: c.name,
    temperaturaMin: c.temperatureMin,
    temperaturaMax: c.temperatureMax,
    luminosidadeMin: c.lightMin,
    luminosidadeMax: c.lightMax,
    irrigacoesPorDia: c.irrigationsPerDay,
    cicloDias: c.cycleDays,
  };
}

export function culturaParaDto(c: Partial<Omit<Cultura, 'id'>>): Partial<Omit<CropDto, 'id'>> {
  const dto: Partial<Omit<CropDto, 'id'>> = {};
  if (c.nome !== undefined) dto.name = c.nome;
  if (c.temperaturaMin !== undefined) dto.temperatureMin = c.temperaturaMin;
  if (c.temperaturaMax !== undefined) dto.temperatureMax = c.temperaturaMax;
  if (c.luminosidadeMin !== undefined) dto.lightMin = c.luminosidadeMin;
  if (c.luminosidadeMax !== undefined) dto.lightMax = c.luminosidadeMax;
  if (c.irrigacoesPorDia !== undefined) dto.irrigationsPerDay = c.irrigacoesPorDia;
  if (c.cicloDias !== undefined) dto.cycleDays = c.cicloDias;
  return dto;
}

const OUTRAS_GRANDEZAS: [SensorTipo, keyof NonNullable<DeviceDto['latestReading']>, string][] = [
  ['temperatura', 'temperature', 'Temperatura'],
  ['umidade_ar', 'airHumidity', 'Umidade do Ar'],
  ['temperatura_folha', 'leafTemperature', 'Temperatura Foliar'],
  ['luminosidade', 'light', 'Luminosidade'],
  ['nivel_agua', 'waterLevel', 'Nível da Água'],
];

/**
 * Uma placa vira um sensor por grandeza que ela mede: o de umidade do solo
 * (se estiver vinculada a uma planta, com id `umi-<plantaId>`) e um para
 * cada outra grandeza presente na última leitura.
 */
export function sensoresDe(d: DeviceDto, plantas: Plant[]): Sensor[] {
  const leitura = d.latestReading;
  const planta = plantas.find((p) => p.id === d.plantId);
  const base = {
    codigo: (d.macAddress ?? d.id).replace(/[^0-9A-Za-z]/g, '').slice(-4).toUpperCase(),
    status: d.online ? ('online' as const) : ('offline' as const),
    localizacao: [planta?.canteiro, d.location].filter(Boolean).join(' · ') || 'Sem localização',
    ultimaLeituraMs: d.lastSeenAt ? ms(d.lastSeenAt) : undefined,
    dispositivoId: d.id,
  };
  const sensores: Sensor[] = [];

  if (d.plantId) {
    sensores.push({
      ...base,
      id: idSensorUmidade(d.plantId),
      nome: `Umidade do Solo · ${d.name}`,
      tipo: 'umidade',
      valor: Math.round(leitura?.humidity ?? planta?.umidadeAtual ?? 0),
      plantaId: d.plantId,
      bruto: leitura?.rawValue ?? undefined,
      calibracao: { placa: d.board === 'ARDUINO' ? 'arduino' : 'esp32', brutoSeco: d.calibration.rawDry, brutoMolhado: d.calibration.rawWet },
      profundidadeCm: d.depthCm ?? undefined,
      posicao: d.position ?? undefined,
    });
  }
  for (const [tipo, campo, rotulo] of OUTRAS_GRANDEZAS) {
    const valor = leitura?.[campo];
    if (typeof valor !== 'number') continue;
    sensores.push({ ...base, id: `${tipo}-${d.id}`, nome: `${rotulo} · ${d.name}`, tipo, valor });
  }
  return sensores;
}

/** Só ciclos encerrados entram no histórico (os abertos aparecem como sessão). */
export function registroDe(e: IrrigationEventDto): RegistroIrrigacao | null {
  if (!e.endedAt) return null;
  return {
    id: e.id,
    plantaId: e.plantId,
    plantaNome: e.plantName,
    canteiro: e.bed ?? '',
    timestamp: ms(e.startedAt),
    duracaoMin: Math.round(e.durationMin ?? 0),
    modo: e.source === 'AUTO' ? 'automatica' : 'manual',
    motivo: e.reason,
    litros: e.liters ?? 0,
    umidadeAntes: Math.round(e.humidityBefore ?? 0),
    umidadeDepois: Math.round(e.humidityAfter ?? 0),
  };
}

export function consumoDe(r: WaterReportDto): ConsumoDia[] {
  return r.days.map((d) => {
    const [ano, mes, dia] = d.date.split('-').map(Number);
    return {
      data: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`,
      ts: new Date(ano, mes - 1, dia).getTime(),
      umidadeMedia: Math.round(d.avgHumidity ?? 0),
      plantasCriticas: d.criticalPlants,
      alertas: d.alerts,
      utilizada: d.usedLiters,
      convencional: d.conventionalLiters,
    };
  });
}

/** Janela em torno de um ciclo considerada "antes" e "depois" da irrigação. */
const JANELA_FASE_MS = 10 * 60 * 1000;

function faseDe(plantaId: string, ts: number, ciclos: IrrigationEventDto[]): FaseLeitura {
  for (const c of ciclos) {
    if (c.plantId !== plantaId) continue;
    const inicio = ms(c.startedAt);
    const fim = c.endedAt ? ms(c.endedAt) : Infinity;
    if (ts >= inicio && ts <= fim) return 'durante';
    if (ts < inicio && inicio - ts <= JANELA_FASE_MS) return 'antes';
    if (ts > fim && ts - fim <= JANELA_FASE_MS) return 'depois';
  }
  return 'rotina';
}

/** Leituras de umidade do solo, com a fase em relação às irrigações. */
export function leiturasDe(leituras: CollectedReadingDto[], ciclos: IrrigationEventDto[]): LeituraColetada[] {
  return leituras.flatMap((l) =>
    l.plantId && l.humidity !== null
      ? [
          {
            id: l.id,
            ts: ms(l.createdAt),
            plantaId: l.plantId,
            plantaNome: l.plantName ?? '',
            sensorCodigo: l.deviceName ?? '',
            bruto: l.rawValue,
            umidade: Math.round(l.humidity),
            fase: faseDe(l.plantId, ms(l.createdAt), ciclos),
          },
        ]
      : []
  );
}
