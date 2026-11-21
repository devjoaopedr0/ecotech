import type { ReactNode } from 'react';
import './Card.css';

interface CardProps {
  title?: string;
  /** Pergunta ou contexto que o cartão responde (ex.: "Como a umidade mudou?"). */
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: 'default' | 'success';
}

export default function Card({ title, subtitle, icon, action, children, className = '', accent = 'default' }: CardProps) {
  return (
    <section className={`card card-${accent} ${className}`}>
      {title && (
        <header className="card-header">
          <div className="card-heading">
            <h2 className="card-title">
              {icon && <span className="card-title-icon" aria-hidden="true">{icon}</span>}
              {title}
            </h2>
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
