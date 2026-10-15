import type { ButtonHTMLAttributes } from 'react';
import './IconButton.css';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'danger';
}

export default function IconButton({ variant = 'default', className = '', ...rest }: IconButtonProps) {
  return <button className={`icon-btn icon-btn-${variant} ${className}`} {...rest} />;
}
