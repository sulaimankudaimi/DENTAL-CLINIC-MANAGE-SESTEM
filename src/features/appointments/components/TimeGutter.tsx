import React from 'react';
import { getTimeSlots, getCalendarConfig, HOUR_HEIGHT } from '../lib/slots';

interface TimeGutterProps {
  startHour?: number;
  endHour?: number;
  hourHeight?: number;
}

export const TimeGutter: React.FC<TimeGutterProps> = ({
  startHour,
  endHour,
  hourHeight = HOUR_HEIGHT,
}) => {
  const config = getCalendarConfig();
  const effectiveStart = startHour ?? config.startHour;
  const effectiveEnd = endHour ?? config.endHour;
  const slots = getTimeSlots(effectiveStart, effectiveEnd);

  return (
    <div
      className="w-16 shrink-0 border-l border-border-default bg-white/70 select-none z-20"
      dir="rtl"
    >
      {/* Header spacer to align with Day Column header */}
      <div className="h-14 border-b border-border-default flex items-center justify-center bg-gray-50/80">
        <span className="text-[11px] font-semibold text-text-tertiary">الوقت</span>
      </div>

      {/* Hourly labels */}
      <div className="relative">
        {slots.map((slot) => (
          <div
            key={slot.hour}
            style={{ height: `${hourHeight}px` }}
            className="border-b border-border-default/60 flex items-start justify-center pt-1.5"
          >
            <span className="text-[11px] font-medium text-text-secondary tracking-tight">
              {slot.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
