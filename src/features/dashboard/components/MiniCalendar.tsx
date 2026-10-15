import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface MiniCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  appointmentDays: Set<number>;
  className?: string;
}

const ARABIC_WEEKDAYS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

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

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  selectedDate,
  onSelectDate,
  appointmentDays,
  className,
}) => {
  const [viewDate, setViewDate] = useState<Date>(new Date(selectedDate));

  const today = new Date();
  const isCurrentMonthView =
    viewDate.getFullYear() === today.getFullYear() &&
    viewDate.getMonth() === today.getMonth();

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // First day of month (0 = Sunday, 6 = Saturday)
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  // Total days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Navigation handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Header display string: e.g. "14 أكتوبر"
  const monthNameAr = ARABIC_MONTHS[currentMonth];
  const headerTitle = `${selectedDate.getDate()} ${monthNameAr}`;

  const handleDayClick = (dayNumber: number) => {
    const newDate = new Date(currentYear, currentMonth, dayNumber);
    onSelectDate(newDate);
  };

  return (
    <Card
      className={cn(
        'p-5 border border-surface-border shadow-card bg-white select-none',
        className
      )}
    >
      {/* Calendar Header with navigation arrows and "14 أكتوبر" */}
      <div className="flex items-center justify-between mb-4">
        {/* Previous Month Arrow (Right Arrow in RTL goes to previous) */}
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue"
          aria-label="الشهر السابق"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Center Title: "14 أكتوبر" */}
        <span className="text-sm font-bold text-text-primary tracking-tight">
          {headerTitle}
        </span>

        {/* Next Month Arrow (Left Arrow in RTL goes to next) */}
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue"
          aria-label="الشهر التالي"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers: ح ن ث ر خ ج س */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {ARABIC_WEEKDAYS.map((dayLabel, idx) => (
          <div
            key={`weekday-${idx}`}
            className="h-8 flex items-center justify-center text-xs font-semibold text-text-secondary"
          >
            {dayLabel}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Leading empty cells before the first day of the month */}
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`empty-pre-${idx}`} className="h-9 w-full" />
        ))}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNumber = idx + 1;
          const isToday =
            isCurrentMonthView && dayNumber === today.getDate();
          const isSelected =
            currentYear === selectedDate.getFullYear() &&
            currentMonth === selectedDate.getMonth() &&
            dayNumber === selectedDate.getDate();
          const hasAppointments = appointmentDays.has(dayNumber);

          return (
            <button
              key={`day-${dayNumber}`}
              type="button"
              onClick={() => handleDayClick(dayNumber)}
              className={cn(
                'h-9 w-full flex flex-col items-center justify-center relative font-mono text-xs transition-colors focus-visible:outline-none',
                isToday
                  ? 'bg-[#2563C9] text-white font-bold rounded-[6px] shadow-xs'
                  : isSelected
                  ? 'bg-surface-hover text-brand-blue font-bold rounded-[6px] border border-brand-blue/30'
                  : 'text-text-primary hover:bg-surface-hover rounded-[6px]'
              )}
              aria-label={`يوم ${dayNumber} ${monthNameAr}`}
              aria-current={isToday ? 'date' : undefined}
            >
              <span>{dayNumber}</span>

              {/* Blue dot for days with appointments */}
              {hasAppointments && (
                <span
                  className={cn(
                    'w-1 h-1 rounded-full absolute bottom-1',
                    isToday ? 'bg-white' : 'bg-[#2563C9]'
                  )}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
};
