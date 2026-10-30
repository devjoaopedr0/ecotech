import type { Plant } from '../../compartilhado/types';

/**
 * Faixa de referência da umidade da planta (0–100%): crítico, atenção, ideal e a leitura atual.
 * Os limites são os cadastrados na planta; o marcador só aparece quando há leitura confiável.
 * Há sempre a lista de valores ao lado/abaixo, então o gráfico não é a única forma de ler os limites.
 */
export default function FaixaUmidade({ planta, atual }: { planta: Plant; atual: number | null }) {
  const pct = (v: number) => `${Math.min(100, Math.max(0, v))}%`;
  const seg = (de: number, ate: number, classe: string) => <span className={`faixa-seg ${classe}`} style={{ left: pct(de), width: pct(ate - de) }} />;
  return (
    <div className="faixa-umidade" role="img" aria-label={`Faixa ideal de ${planta.faixaMin}% a ${planta.faixaMax}%${atual !== null ? `. Umidade atual: ${atual}%` : ''}`}>
      <div className="faixa-barra">
        {seg(0, planta.umidadeCritica, 'faixa-critico')}
        {seg(planta.umidadeCritica, planta.umidadeMinima, 'faixa-atencao')}
        {seg(planta.umidadeMinima, planta.faixaMin, 'faixa-aceitavel')}
        {seg(planta.faixaMin, planta.faixaMax, 'faixa-ideal')}
        {seg(planta.faixaMax, planta.umidadeMaxima, 'faixa-aceitavel')}
        {seg(planta.umidadeMaxima, 100, 'faixa-atencao')}
        {atual !== null && <span className="faixa-marcador" style={{ left: pct(atual) }}><span>{atual}%</span></span>}
      </div>
      <div className="faixa-escala"><span>0%</span><span>50%</span><span>100%</span></div>
    </div>
  );
}
