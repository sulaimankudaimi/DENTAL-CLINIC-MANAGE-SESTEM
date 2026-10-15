import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20 focus-visible:border-brand-blue disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap rounded-lg',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-blue text-white hover:bg-brand-navy-deep active:bg-brand-navy shadow-sm',
        secondary:
          'bg-surface-card text-text-primary border border-surface-border hover:bg-surface-hover hover:border-surface-border active:bg-surface-app shadow-sm',
        outline:
          'bg-surface-card text-text-primary border border-surface-border hover:bg-surface-hover hover:border-surface-border active:bg-surface-app shadow-sm',
        ghost:
          'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary active:bg-surface-app',
        danger:
          'bg-status-danger-fg text-white hover:opacity-90 active:opacity-100 shadow-sm',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-12 px-6 text-base gap-2.5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      disabled,
      icon,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <Spinner size={size === 'sm' ? 'sm' : 'md'} className="shrink-0" />
        ) : icon ? (
          <span className="shrink-0 inline-flex items-center justify-center" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
