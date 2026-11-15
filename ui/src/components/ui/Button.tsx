import { assertResourceName } from '@/resourceName';
assertResourceName();

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variants = { primary: 'btn-primary', secondary: 'btn-secondary', danger: 'btn-danger-soft', ghost: 'btn-ghost' };
const sizes = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, children, disabled, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} disabled={disabled || isLoading} className={`btn ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
