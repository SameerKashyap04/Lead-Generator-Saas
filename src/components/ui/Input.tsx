/* ============================================================
   LeadScaper Pro — Input Component
   ============================================================ */

import React, { forwardRef } from 'react';
import { cn } from '@/utils/formatters';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, hint, className, id, ...props }, ref) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full px-3.5 py-2.5 rounded-xl text-sm',
              'bg-[var(--bg-secondary)] text-[var(--text-primary)]',
              'border border-[var(--border-primary)]',
              'placeholder:text-[var(--text-tertiary)]',
              'transition-all duration-200',
              'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
              'hover:border-[var(--border-accent)]',
              !!icon && 'pl-10',
              error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
              {icon}
            </span>
          )}
        </div>
        {error && <span className="text-xs text-red-400">{error}</span>}
        {hint && !error && <span className="text-xs text-[var(--text-tertiary)]">{hint}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
