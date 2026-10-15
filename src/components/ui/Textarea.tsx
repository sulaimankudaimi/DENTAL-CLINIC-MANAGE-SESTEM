import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, disabled, required, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-semibold text-text-primary select-none flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-status-danger-fg ms-1">*</span>}
            </span>
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
              ? `${textareaId}-helper`
              : undefined
          }
          className={cn(
            'w-full px-3 py-2 text-xs bg-surface-card text-text-primary rounded-lg border transition-colors placeholder:text-text-muted resize-y min-h-[72px]',
            'focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20',
            'disabled:bg-surface-hover disabled:text-text-muted disabled:cursor-not-allowed',
            error
              ? 'border-status-danger-fg focus:border-status-danger-fg focus:ring-status-danger-fg/20'
              : 'border-surface-border',
            className
          )}
          {...props}
        />

        {error ? (
          <p id={`${textareaId}-error`} className="text-xs text-status-danger-fg font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${textareaId}-helper`} className="text-xs text-text-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
