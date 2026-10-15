import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      startIcon,
      endIcon,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-text-primary select-none flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-status-danger-fg ms-1">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center w-full">
          {startIcon && (
            <div
              className="absolute start-3 flex items-center justify-center pointer-events-none text-text-secondary"
              aria-hidden="true"
            >
              {startIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            className={cn(
              'w-full h-10 px-3 py-2 text-xs bg-surface-card text-text-primary rounded-lg border transition-colors placeholder:text-text-muted',
              'focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20',
              'disabled:bg-surface-hover disabled:text-text-muted disabled:cursor-not-allowed',
              startIcon && 'ps-9',
              endIcon && 'pe-9',
              error
                ? 'border-status-danger-fg focus:border-status-danger-fg focus:ring-status-danger-fg/20'
                : 'border-surface-border',
              className
            )}
            {...props}
          />

          {endIcon && (
            <div
              className="absolute end-3 flex items-center justify-center pointer-events-none text-text-secondary"
              aria-hidden="true"
            >
              {endIcon}
            </div>
          )}
        </div>

        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-status-danger-fg font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-xs text-text-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
