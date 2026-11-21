import { useHorta } from '../../hooks/useHorta';
import type { NivelDashboard } from '../../types';
import { formatarRelativo } from '../../utils/format';
import { LIMITE_TEMPERATURA_ELEVADA } from '../../utils/alertas';
import { faixaIdealMedia, saudeDaHorta } from '../../utils/horta';
import Card from '../Card';
import Metrica from '../Metrica';
import { AlertOctagonIcon, CheckCircleIcon, DropletIcon, LeafIcon, ThermometerIcon, WarningIcon, WifiIcon } from '../icons';

const dec = (n: number) => n.toFixed(1).replace('.', ',');

/**
 * Linha de abertura da Visão Geral (avançada): situação + índice de saúde e cinco métricas técnicas com contexto
 * (faixa de referência, dispersão entre plantas/sensores, status). Todos os valores vêm de useHorta.
 * nivel="intermediario" mantém a versão essencial (situação, umidade e irrigação) para compatibilidade.
 */
export default function ResumoHorta({ nivel = 'avancado' }: { nivel?: NivelDashboard }) {
  const { indicadores: ind, situacao, algumaIrrigando, irrigacoesAtivas, agora, monitoradas } = useHorta();
  const essencial = nivel === 'intermediario';
  const saude = saudeDaHorta(ind);
  const faixa = faixaIdealMedia(monitoradas);
  const u = ind.umidadeMedia;
  const umidadeTom = u === null || !faixa ? undefined : u < faixa.min ? 'atencao' : u > faixa.max ? 'atencao' : 'ok';
  const umidadeTexto = u === null ? 'Sem leitura confiável' : !faixa ? 'Sem faixa configurada' : u < faixa.min ? 'Abaixo da faixa ideal' : u > faixa.max ? 'Acima da faixa ideal' : 'Dentro da faixa ideal';
  const temperatura = !essencial && ind.temperatura;
  const precisam = ind.criticas + ind.atencao;

  return (
    <section className={`vg-top-row ${essencial ? 'vg-top-row-3' : temperatura ? 'vg-top-row-6' : ''}`} aria-label="Resumo da horta">
      <Card accent={situacao.nivel === 'ok' ? 'success' : 'default'} className={`vg-health-card vg-health-${situacao.nivel}`}>
        <div className={`vg-health-icon ${situacao.nivel !== 'ok' ? `vg-health-icon-${situacao.nivel}` : ''}`} aria-hidden="true">
          {situacao.nivel === 'ok' ? <CheckCircleIcon width={26} height={26} /> : situacao.nivel === 'critico' ? <AlertOctagonIcon width={26} height={26} /> : <WarningIcon width={26} height={26} />}
        </div>
        <div className="vg-health-texto">
          <h2>{situacao.titulo}</h2>
          <p>{situacao.texto}</p>
          {!essencial && saude.pontuacao !== null && (
            <div className="vg-indice" aria-label={`Índice de saúde: ${saude.pontuacao} de 100, ${saude.rotulo}`}>
              <span>Índice de saúde</span>
              <div className="vg-indice-barra" aria-hidden="true"><div className={`vg-indice-${saude.faixa}`} style={{ width: `${saude.pontuacao}%` }} /></div>
              <strong className="num">{saude.pontuacao}<small>/100</small></strong>
            </div>
          )}
        </div>
      </Card>

      <Metrica
        icone={<DropletIcon />}
        rotulo="Umidade média do solo"
        valor={u === null ? '—' : String(u)}
        unidade={u === null ? undefined : '%'}
        status={umidadeTom ? { tom: umidadeTom, texto: umidadeTexto } : { tom: 'offline', texto: umidadeTexto }}
        contexto={
          <>
            {faixa && `Ideal ${faixa.min}–${faixa.max}%`}
            {!essencial && ind.umidadeMinima !== null && ` · plantas ${ind.umidadeMinima}–${ind.umidadeMaxima}%`}
            {essencial && ind.ultimaLeituraMs ? ` · ${formatarRelativo(ind.ultimaLeituraMs, agora)}` : ''}
          </>
        }
      />

      {temperatura && (
        <Metrica
          icone={<ThermometerIcon />}
          rotulo="Temperatura do ar"
          valor={dec(temperatura.media)}
          unidade="°C"
          status={temperatura.max > LIMITE_TEMPERATURA_ELEVADA ? { tom: 'atencao', texto: `Pico de ${dec(temperatura.max)} °C` } : { tom: 'ok', texto: `Abaixo de ${LIMITE_TEMPERATURA_ELEVADA} °C` }}
          contexto={temperatura.sensores === 1 ? '1 sensor online' : `${temperatura.sensores} sensores · ${dec(temperatura.min)}–${dec(temperatura.max)} °C`}
        />
      )}

      {!essencial && (
        <Metrica
          icone={<LeafIcon />}
          rotulo="Plantas monitoradas"
          valor={String(ind.plantasComLeitura)}
          unidade={`/ ${ind.totalPlantas}`}
          status={ind.criticas > 0 ? { tom: 'critico', texto: `${ind.criticas} crítica${ind.criticas > 1 ? 's' : ''}` } : precisam > 0 ? { tom: 'atencao', texto: `${precisam} em atenção` } : { tom: 'ok', texto: 'Todas na faixa' }}
          contexto={`${ind.saudaveis} saudáveis · ${ind.atencao} atenção${ind.semDados > 0 ? ` · ${ind.semDados} sem leitura` : ''}`}
        />
      )}

      <Metrica
        icone={<DropletIcon />}
        rotulo="Irrigação"
        valor={algumaIrrigando ? 'Ativa' : 'Em espera'}
        status={algumaIrrigando ? { tom: 'info', texto: `${irrigacoesAtivas} em andamento` } : { tom: 'ok', texto: 'Nenhuma válvula aberta' }}
        contexto={ind.criticas > 0 && !algumaIrrigando ? 'Há planta crítica sem irrigação ativa' : undefined}
      />

      {!essencial && (
        <Metrica
          icone={<WifiIcon />}
          rotulo="Sensores"
          valor={String(ind.dispositivos.online)}
          unidade={`/ ${ind.dispositivos.total}`}
          status={ind.dispositivos.offline === 0 ? { tom: 'ok', texto: 'Todos online' } : { tom: 'offline', texto: `${ind.dispositivos.offline} offline` }}
          contexto={ind.dispositivos.total ? `${Math.round((ind.dispositivos.online / ind.dispositivos.total) * 100)}% da rede conectada` : undefined}
        />
      )}
    </section>
  );
}
