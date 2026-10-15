import type { InputHTMLAttributes, ReactNode } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  label?: string;
  trailing?: ReactNode;
}

export default function Input({ icon, label, trailing, className = '', ...rest }: InputProps) {
  return (
    <label className="input-field">
      {label && <span className="input-label">{label}</span>}
      <div className={`input-wrap ${className}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <input {...rest} />
        {trailing && <span className="input-trailing">{trailing}</span>}
      </div>
    </label>
  );
}
