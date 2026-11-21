import SaudeHorta from '../../compartilhado/components/SaudeHorta';
import { avaliarAtualizacao } from '../regras/atualizacao';
import { useIntermediario } from '../useIntermediario';

/**
 * Resumo da horta na intermediária: Centro de Saúde da Horta (nota 0–100, frase simples e seis indicadores com contexto).
 * Os números vêm de useHorta (mesma fonte e regras da avançada). Se os dados estão desatualizados, a nota não é
 * afirmada como atual: um aviso explica que ela pode não refletir o momento.
 */
export default function ResumoInteligente() {
  const { indicadores: ind, plantas, leituras, agora, central } = useIntermediario();
  const dados = avaliarAtualizacao(plantas, leituras, agora);
  const aviso = dados.desatualizado && ind.totalPlantas > 0 ? 'Dados desatualizados: a situação pode não refletir o momento atual.' : undefined;
  return <SaudeHorta aviso={aviso} ocorrencias={central.length} />;
}
