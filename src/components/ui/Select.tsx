import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onChange?: (e: any) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      placeholder = 'اختر...',
      options,
      value,
      defaultValue,
      onValueChange,
      onChange,
      disabled,
      required,
      id,
      className,
    },
    ref
  ) => {
    const selectId = id || (label ? `select-${label.replace(/\s+/g, '-')}` : undefined);

    const handleValueChange = (val: string) => {
      onValueChange?.(val);
      if (onChange) {
        onChange({ target: { value: val }, currentTarget: { value: val } });
      }
    };

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-text-primary select-none flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-status-danger-fg ms-1">*</span>}
            </span>
          </label>
        )}

        <SelectPrimitive.Root
          value={value}
          defaultValue={defaultValue}
          onValueChange={handleValueChange}
          disabled={disabled}
          dir="rtl"
        >
          <SelectPrimitive.Trigger
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error)}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-lg border bg-surface-card px-3 py-2 text-xs text-text-primary transition-colors',
              'placeholder:text-text-muted focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20',
              'disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-text-muted',
              error
                ? 'border-status-danger-fg focus:border-status-danger-fg focus:ring-status-danger-fg/20'
                : 'border-surface-border',
              className
            )}
          >
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon asChild>
              <ChevronDown className="w-4 h-4 text-text-secondary transition-transform duration-200" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              dir="rtl"
              position="popper"
              sideOffset={4}
              className="relative z-50 min-w-[8rem] overflow-hidden rounded-lg border border-surface-border bg-surface-card shadow-lg animate-in fade-in-80"
            >
              <SelectPrimitive.Viewport className="p-1">
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={cn(
                      'relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pe-8 ps-2 text-xs outline-none transition-colors',
                      'text-text-primary hover:bg-surface-hover focus:bg-surface-hover',
                      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                    )}
                  >
                    <span className="absolute end-2 flex h-3.5 w-3.5 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Check className="h-3.5 w-3.5 text-brand-blue" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>

        {error ? (
          <p className="text-xs text-status-danger-fg font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
