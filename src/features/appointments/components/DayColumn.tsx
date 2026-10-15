import React, { useState } from 'react';
import { Appointment, Patient, Procedure } from '@shared/contracts';
import { DayInfo, getCalendarConfig, HOUR_HEIGHT, getAppointmentPosition, getCurrentTimeTop, pixelOffsetToTime } from '../lib/slots';
import { AppointmentCard } from './AppointmentCard';
import clsx from 'clsx';

interface DayColumnProps {
  day: DayInfo;
  appointments: Appointment[];
  patientsMap: Map<string, Patient>;
  proceduresMap: Map<string, Procedure>;
  hourHeight?: number;
  onAppointmentClick?: (appt: Appointment) => void;
  onSlotClick?: (dateStr: string, startAt: string, endAt: string, dutyDoctorId?: string) => void;
  onDragStartAppt?: (e: React.DragEvent, appt: Appointment) => void;
  onDropAppt?: (targetDateStr: string, targetYPx: number) => void;
  onResizeDuration?: (appt: Appointment, newDurationMin: number) => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({
  day,
  appointments,
  patientsMap,
  proceduresMap,
  hourHeight = HOUR_HEIGHT,
  onAppointmentClick,
  onSlotClick,
  onDragStartAppt,
  onDropAppt,
  onResizeDuration,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const config = getCalendarConfig();
  const totalHours = config.endHour - config.startHour + 1;
  const currentTimeTop = day.isToday ? getCurrentTimeTop(config.startHour, config.endHour, hourHeight) : null;

  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only fire if clicking directly on column background or slot line (not on an appointment card)
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('slot-guide')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const yOffset = e.clientY - rect.top;
    const { startAt, endAt } = pixelOffsetToTime(day.dateStr, yOffset, config.slotDurationMinutes, config.startHour, hourHeight);
    onSlotClick?.(day.dateStr, startAt, endAt, day.dutyDoctorId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const yOffset = e.clientY - rect.top;
    onDropAppt?.(day.dateStr, yOffset);
  };

  return (
    <div
      id={`day-column-${day.dateStr}`}
      className={clsx(
        'flex-1 min-w-[140px] border-l border-border-default last:border-l-0 flex flex-col transition-colors',
        day.isToday && 'bg-blue-50/20',
        isDragOver && 'bg-brand-blue/10 ring-2 ring-brand-blue inset-0'
      )}
    >
      {/* Column Header matching screenshot */}
      <div className="h-14 border-b border-border-default px-2 py-1.5 flex flex-col items-center justify-center bg-gray-50/80 select-none">
        <span
          className={clsx(
            'text-xs font-bold',
            day.isToday ? 'text-brand-blue' : 'text-text-primary'
          )}
        >
          {day.dayNameAr}
        </span>
        <span className="text-[11px] font-medium text-text-tertiary mt-0.5 truncate max-w-full">
          {day.dutyDoctorName}
        </span>
      </div>

      {/* Grid Canvas */}
      <div
        onClick={handleColumnClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ height: `${totalHours * hourHeight}px` }}
        className="relative w-full cursor-pointer"
      >
        {/* Background Hourly Slot Guidelines */}
        {Array.from({ length: totalHours }).map((_, idx) => (
          <div
            key={idx}
            style={{ height: `${hourHeight}px` }}
            className="slot-guide border-b border-border-default/60 hover:bg-gray-50/40 transition-colors w-full"
          />
        ))}

        {/* Current Time Red Indicator Line */}
        {currentTimeTop !== null && (
          <div
            style={{ top: `${currentTimeTop}px` }}
            className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 -mr-1 shadow-sm" />
            <div className="flex-1 h-[2px] bg-red-500 shadow-sm" />
          </div>
        )}

        {/* Render Appointments */}
        {appointments.map((appt) => {
          const { top, height } = getAppointmentPosition(
            appt.start_at,
            appt.end_at,
            config.startHour,
            hourHeight
          );

          const patient = patientsMap.get(appt.patient_id);
          // Look up procedure names
          const procNames =
            appt.procedure_ids && appt.procedure_ids.length > 0
              ? appt.procedure_ids
                  .map((id) => proceduresMap.get(id)?.name_ar || proceduresMap.get(id)?.name_en || 'إجراء')
                  .join('، ')
              : 'كشف عام';

          return (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              patient={patient}
              procedureNames={procNames}
              top={top}
              height={height}
              onClick={onAppointmentClick}
              onDragStart={onDragStartAppt}
              onResizeDuration={onResizeDuration}
            />
          );
        })}
      </div>
    </div>
  );
};
