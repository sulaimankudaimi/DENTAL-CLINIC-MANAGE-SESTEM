import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './Card';

export type StatCardTone = 'green' | 'blue' | 'amber' | 'rose';

export interface StatCardTrend {
  value: string | number;
  isPositive: boolean;
  label?: string;
}

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  title?: string;
  subtitle?: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: StatCardTone;
  trend?: StatCardTrend;
}

const toneStyles: Record<StatCardTone, { iconBox: string; iconColor: string }> = {
  green: {
    iconBox: 'bg-status-ok-bg',
    iconColor: 'text-status-ok-fg',
  },
  blue: {
    iconBox: 'bg-status-info-bg',
    iconColor: 'text-brand-blue',
  },
  amber: {
    iconBox: 'bg-status-warn-bg',
    iconColor: 'text-status-warn-fg',
  },
  rose: {
    iconBox: 'bg-status-danger-bg',
    iconColor: 'text-status-danger-fg',
  },
};

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, title, subtitle, value, icon, tone = 'blue', trend, className, ...props }, ref) => {
    const displayLabel = label || title || '';
    const { iconBox, iconColor } = toneStyles[tone] || toneStyles.blue;

    return (
      <Card
        ref={ref}
        className={cn('p-5 flex items-center justify-between transition-shadow hover:shadow-md', className)}
        {...props}
      >
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-medium text-text-secondary truncate">{displayLabel}</span>
          <span className="stat-number text-2xl font-bold text-text-primary tracking-tight">
            {value}
          </span>
          {subtitle && (
            <span className="text-[11px] text-text-muted truncate">{subtitle}</span>
          )}
          {trend && (
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-semibold',
                  trend.isPositive ? 'text-status-ok-fg' : 'text-status-danger-fg'
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )}
                <span dir="ltr">{trend.value}</span>
              </span>
              {trend.label && <span className="text-text-muted text-[11px]">{trend.label}</span>}
            </div>
          )}
        </div>

        <div
          className={cn(
            'w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0 shadow-sm',
            iconBox,
            iconColor
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      </Card>
    );
  }
);

StatCard.displayName = 'StatCard';
