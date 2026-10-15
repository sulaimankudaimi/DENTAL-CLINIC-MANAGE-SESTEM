import React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string;
  description?: string;
  error?: string;
}

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, label, description, error, id, ...props }, ref) => {
  const switchId = id || (label ? `switch-${label.replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-4">
        {(label || description) && (
          <div className="flex flex-col gap-0.5">
            {label && (
              <label
                htmlFor={switchId}
                className="text-xs font-semibold text-text-primary cursor-pointer select-none"
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-xs text-text-muted select-none">{description}</span>
            )}
          </div>
        )}

        <SwitchPrimitive.Root
          ref={ref}
          id={switchId}
          dir="ltr"
          className={cn(
            'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20 focus-visible:border-brand-blue',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-brand-blue data-[state=unchecked]:bg-surface-divider',
            error && 'ring-1 ring-status-danger-fg',
            className
          )}
          {...props}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform',
              'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
            )}
          />
        </SwitchPrimitive.Root>
      </div>

      {error && <p className="text-xs text-status-danger-fg font-medium">{error}</p>}
    </div>
  );
});

Switch.displayName = 'Switch';
