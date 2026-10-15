import React from 'react';
import { FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon,
      title,
      description,
      actionText,
      onAction,
      actionIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center p-8 text-center rounded-card bg-surface-card border border-surface-border shadow-sm max-w-md mx-auto',
          className
        )}
        {...props}
      >
        <div
          className="w-14 h-14 rounded-full bg-surface-hover flex items-center justify-center text-text-secondary mb-4 border border-surface-border"
          aria-hidden="true"
        >
          {icon || <FolderOpen className="w-7 h-7" />}
        </div>

        <h3 className="text-base font-bold text-text-primary mb-1.5">{title}</h3>

        {description && (
          <p className="text-xs text-text-secondary leading-relaxed max-w-xs mb-5">
            {description}
          </p>
        )}

        {actionText && onAction && (
          <Button variant="primary" size="md" onClick={onAction} icon={actionIcon}>
            {actionText}
          </Button>
        )}

        {children}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';
