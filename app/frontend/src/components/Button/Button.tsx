import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  fullWidth?: boolean;
  active?: boolean;
}

export default function Button({
  variant = 'secondary',
  icon,
  fullWidth,
  active,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} ${fullWidth ? 'btn-full' : ''} ${active ? 'btn-active' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
