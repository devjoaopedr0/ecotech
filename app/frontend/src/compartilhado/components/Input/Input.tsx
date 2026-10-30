import type { InputHTMLAttributes, ReactNode } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  label?: string;
  trailing?: ReactNode;
  error?: string;
}

export default function Input({ icon, label, trailing, error, className = '', ...rest }: InputProps) {
  return (
    <label className="input-field">
      {label && <span className="input-label">{label}</span>}
      <div className={`input-wrap ${error ? 'input-wrap-error' : ''} ${className}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <input aria-invalid={error ? true : undefined} {...rest} />
        {trailing && <span className="input-trailing">{trailing}</span>}
      </div>
      {error && <span className="input-error">{error}</span>}
    </label>
  );
}
