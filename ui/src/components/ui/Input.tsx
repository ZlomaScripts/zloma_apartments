import { assertResourceName } from '@/resourceName';
assertResourceName();

import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { icon?: React.ReactNode }

export const Input = forwardRef<HTMLInputElement, InputProps>(({ icon, className = '', ...props }, ref) => (
  <div className="relative w-full">
    {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none">{icon}</div>}
    <input ref={ref} className={`input ${icon ? 'pl-10' : ''} ${className}`} {...props} />
  </div>
));
Input.displayName = 'Input';
