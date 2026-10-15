import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, actions, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5',
          className
        )}
        {...props}
      >
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-[22px] font-bold text-text-primary leading-tight tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-text-secondary leading-normal">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    );
  }
);

PageHeader.displayName = 'PageHeader';
