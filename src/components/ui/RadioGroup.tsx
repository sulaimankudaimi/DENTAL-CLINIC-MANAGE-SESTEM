import React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  options: RadioOption[];
  label?: string;
  error?: string;
  helperText?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(
  (
    {
      className,
      options,
      label,
      error,
      helperText,
      orientation = 'vertical',
      id,
      ...props
    },
    ref
  ) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <span className="text-xs font-semibold text-text-primary select-none">{label}</span>
        )}

        <RadioGroupPrimitive.Root
          ref={ref}
          dir="rtl"
          className={cn(
            'flex gap-3',
            orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
            className
          )}
          {...props}
        >
          {options.map((option) => {
            const itemId = `radio-${id || 'group'}-${option.value}`;
            return (
              <div key={option.value} className="flex items-center gap-2">
                <RadioGroupPrimitive.Item
                  id={itemId}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    'aspect-square h-4 w-4 rounded-full border bg-surface-card transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20 focus-visible:border-brand-blue',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'data-[state=checked]:border-brand-blue',
                    error ? 'border-status-danger-fg' : 'border-surface-border'
                  )}
                >
                  <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-brand-blue" />
                  </RadioGroupPrimitive.Indicator>
                </RadioGroupPrimitive.Item>

                <label
                  htmlFor={itemId}
                  className="text-xs font-medium text-text-primary cursor-pointer select-none"
                >
                  {option.label}
                </label>
              </div>
            );
          })}
        </RadioGroupPrimitive.Root>

        {error ? (
          <p className="text-xs text-status-danger-fg font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';
