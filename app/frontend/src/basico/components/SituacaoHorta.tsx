import { HealthyIcon, WarningIcon } from '../../compartilhado/components/icons';
import { useBasico } from '../useBasico';

/** Faixa grande do topo: uma frase dizendo como está a horta (ícone + texto, nunca só cor). */
export default function SituacaoHorta() {
  const { resumo } = useBasico();
  const Icone = resumo.nivel === 'ok' ? HealthyIcon : WarningIcon;
  return (
    <section className={`basico-situacao basico-situacao-${resumo.nivel}`} role="status" aria-live="polite">
      <Icone width={40} height={40} aria-hidden="true" />
      <div>
        <h2>{resumo.titulo}</h2>
        <p>{resumo.texto}</p>
      </div>
    </section>
  );
}
