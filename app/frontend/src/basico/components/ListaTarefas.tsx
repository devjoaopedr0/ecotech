import EmptyState from '../../compartilhado/components/EmptyState';
import { CheckIcon, WarningIcon } from '../../compartilhado/components/icons';
import type { Tarefa } from '../regras/simples';

/** O que fazer agora, uma tarefa por linha (urgentes marcadas). Sem tarefas, um aviso positivo. */
export default function ListaTarefas({ tarefas }: { tarefas: Tarefa[] }) {
  if (tarefas.length === 0) {
    return <EmptyState icone={<CheckIcon width={30} height={30} />} titulo="Nada para fazer agora" texto="Suas plantas estão bem." />;
  }
  return (
    <ul className="basico-tarefas">
      {tarefas.map((t) => (
        <li key={t.id} className={t.urgente ? 'basico-tarefa-urgente' : ''}>
          <WarningIcon width={22} height={22} aria-hidden="true" />
          <div>
            <strong>
              {t.urgente && <span className="basico-tag">Urgente</span>}
              {t.texto}
            </strong>
            <span>{t.detalhe}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
