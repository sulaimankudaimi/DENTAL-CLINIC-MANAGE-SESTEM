import React, { useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateAr, toHijri } from '@/lib/formatters';

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const ARABIC_WEEKDAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

export interface DatePickerArProps {
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export const DatePickerAr: React.FC<DatePickerArProps> = ({
  value,
  onChange,
  placeholder = 'اختر التاريخ...',
  label,
  error,
  helperText,
  disabled = false,
  required = false,
  minDate,
  maxDate,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => value || new Date());

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // First day of current view month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Saturday is index 0
  const startDayIndex = (firstDayOfMonth.getDay() + 1) % 7;

  // Previous month filler days
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const handleSelectDay = (day: number) => {
    const selected = new Date(currentYear, currentMonth, day, 12, 0, 0);
    if (onChange) {
      onChange(selected);
    }
    setOpen(false);
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    return (
      value.getFullYear() === currentYear &&
      value.getMonth() === currentMonth &&
      value.getDate() === day
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonth &&
      today.getDate() === day
    );
  };

  const isDayDisabled = (day: number) => {
    const checkDate = new Date(currentYear, currentMonth, day);
    if (minDate && checkDate < new Date(minDate.setHours(0, 0, 0, 0))) return true;
    if (maxDate && checkDate > new Date(maxDate.setHours(23, 59, 59, 999))) return true;
    return false;
  };

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      {label && (
        <span className="text-xs font-semibold text-text-primary select-none flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-status-danger-fg ms-1">*</span>}
          </span>
        </span>
      )}

      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild disabled={disabled}>
          <button
            type="button"
            dir="rtl"
            aria-invalid={Boolean(error)}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-lg border bg-surface-card px-3 py-2 text-xs text-text-primary transition-colors text-right',
              'focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20',
              'disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-text-muted',
              error
                ? 'border-status-danger-fg focus:border-status-danger-fg focus:ring-status-danger-fg/20'
                : 'border-surface-border'
            )}
          >
            <div className="flex flex-col text-right justify-center">
              {value ? (
                <>
                  <span className="font-medium text-text-primary text-xs">
                    {formatDateAr(value)}
                  </span>
                  <span className="text-[10px] text-text-secondary mt-0.5">
                    {toHijri(value)}
                  </span>
                </>
              ) : (
                <span className="text-text-muted text-xs">{placeholder}</span>
              )}
            </div>
            <CalendarIcon className="w-4 h-4 text-text-secondary shrink-0" aria-hidden="true" />
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            dir="rtl"
            sideOffset={4}
            align="start"
            className="z-50 w-72 rounded-card border border-surface-border bg-surface-card p-3 shadow-lg animate-in fade-in-80"
          >
            {/* Header: Month / Year Navigation */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-divider">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                aria-label="الشهر السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="text-xs font-bold text-text-primary">
                {ARABIC_MONTHS[currentMonth]} {currentYear}
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                aria-label="الشهر التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Weekdays row */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {ARABIC_WEEKDAYS.map((wd) => (
                <span
                  key={wd}
                  className="text-[10px] font-semibold text-text-muted py-1 select-none"
                >
                  {wd.slice(0, 3)}
                </span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Previous month filler days */}
              {Array.from({ length: startDayIndex }).map((_, i) => {
                const prevDay = daysInPrevMonth - startDayIndex + 1 + i;
                return (
                  <span
                    key={`prev-${i}`}
                    className="text-[11px] text-text-muted/40 py-1.5 select-none"
                  >
                    {prevDay}
                  </span>
                );
              })}

              {/* Current month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const active = isSelected(day);
                const today = isToday(day);
                const dayDisabled = isDayDisabled(day);

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    disabled={dayDisabled}
                    onClick={() => handleSelectDay(day)}
                    className={cn(
                      'text-xs py-1.5 rounded-md font-medium transition-colors select-none',
                      active
                        ? 'bg-brand-blue text-white font-bold shadow-sm'
                        : today
                        ? 'border border-brand-blue text-brand-blue font-semibold hover:bg-surface-hover'
                        : 'text-text-primary hover:bg-surface-hover',
                      dayDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent'
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer with Hijri equivalent preview if selected */}
            {value && (
              <div className="mt-3 pt-2 border-t border-surface-divider text-center">
                <span className="text-[11px] text-text-secondary font-medium block">
                  الموافق هجرياً: {toHijri(value)}
                </span>
              </div>
            )}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {error ? (
        <p className="text-xs text-status-danger-fg font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
};

DatePickerAr.displayName = 'DatePickerAr';
