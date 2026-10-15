import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors select-none whitespace-nowrap',
  {
    variants: {
      variant: {
        ok: 'bg-status-ok-bg text-status-ok-fg',
        warn: 'bg-status-warn-bg text-status-warn-fg',
        danger: 'bg-status-danger-bg text-status-danger-fg',
        info: 'bg-status-info-bg text-status-info-fg',
        neutral: 'bg-surface-hover text-text-secondary border border-surface-border',
        success: 'bg-status-ok-bg text-status-ok-fg',
        warning: 'bg-status-warn-bg text-status-warn-fg',
        default: 'bg-surface-hover text-text-secondary border border-surface-border',
        primary: 'bg-brand-blue text-white',
        secondary: 'bg-surface-hover text-text-primary border border-surface-border',
        outline: 'bg-transparent text-text-secondary border border-surface-border',
        error: 'bg-status-danger-bg text-status-danger-fg',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  }
);

const dotColorMap: Record<string, string> = {
  ok: 'bg-status-ok-fg',
  warn: 'bg-status-warn-fg',
  danger: 'bg-status-danger-fg',
  info: 'bg-status-info-fg',
  neutral: 'bg-text-secondary',
  success: 'bg-status-ok-fg',
  warning: 'bg-status-warn-fg',
  default: 'bg-text-secondary',
  primary: 'bg-brand-blue',
  secondary: 'bg-text-secondary',
  outline: 'bg-text-secondary',
  error: 'bg-status-danger-fg',
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', size = 'md', dot = false, children, ...props }, ref) => {
    const activeVariant = variant || 'neutral';

    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant: activeVariant, size, className }))}
        {...props}
      >
        {dot && (
          <span
            className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColorMap[activeVariant])}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
