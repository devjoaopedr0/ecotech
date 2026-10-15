import type { ReactNode } from 'react';
import './Card.css';

interface CardProps {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: 'default' | 'success';
}

export default function Card({ title, icon, action, children, className = '', accent = 'default' }: CardProps) {
  return (
    <section className={`card card-${accent} ${className}`}>
      {title && (
        <header className="card-header">
          <h2 className="card-title">
            {icon}
            {title}
          </h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
