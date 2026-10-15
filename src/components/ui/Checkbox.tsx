import React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, error, helperText, id, ...props }, ref) => {
  const checkboxId = id || (label ? `chk-${label.replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <CheckboxPrimitive.Root
          ref={ref}
          id={checkboxId}
          aria-invalid={Boolean(error)}
          className={cn(
            'peer h-4 w-4 shrink-0 rounded border bg-surface-card transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20 focus-visible:border-brand-blue',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-brand-blue data-[state=checked]:border-brand-blue data-[state=checked]:text-white',
            error ? 'border-status-danger-fg' : 'border-surface-border',
            className
          )}
          {...props}
        >
          <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
            <Check className="h-3 w-3 stroke-[3]" />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>

        {label && (
          <label
            htmlFor={checkboxId}
            className="text-xs font-medium text-text-primary cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
      </div>

      {error ? (
        <p className="text-xs text-status-danger-fg font-medium ms-6">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-text-muted ms-6">{helperText}</p>
      ) : null}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';
