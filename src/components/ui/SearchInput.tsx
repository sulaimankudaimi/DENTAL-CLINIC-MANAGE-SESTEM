import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      placeholder = 'البحث عن مريض أو موعد...',
      value,
      onChange,
      onClear,
      disabled,
      ...props
    },
    ref
  ) => {
    const hasValue = Boolean(value && String(value).length > 0);

    return (
      <div className={cn('relative flex items-center w-full', className)}>
        <span
          className="absolute start-3.5 flex items-center justify-center text-text-secondary pointer-events-none"
          aria-hidden="true"
        >
          <Search className="w-4 h-4" />
        </span>

        <input
          ref={ref}
          type="search"
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'w-full h-10 ps-10 pe-9 py-2 text-xs bg-surface-input text-text-primary rounded-lg border-0 transition-all',
            'placeholder:text-text-muted',
            'focus:outline-none focus:bg-surface-card focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          {...props}
        />

        {hasValue && onClear && !disabled && (
          <button
            type="button"
            onClick={onClear}
            className="absolute end-3 p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label="مسح البحث"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
