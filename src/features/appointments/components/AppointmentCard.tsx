import React, { useState } from 'react';
import { Appointment, Patient } from '@shared/contracts';
import clsx from 'clsx';
import { GripVertical } from 'lucide-react';

interface AppointmentCardProps {
  appointment: Appointment;
  patient?: Patient;
  procedureNames?: string;
  top: number;
  height: number;
  onClick?: (appt: Appointment) => void;
  onDragStart?: (e: React.DragEvent, appt: Appointment) => void;
  onResizeDuration?: (appt: Appointment, newDurationMin: number) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  patient,
  procedureNames = 'كشف عام',
  top,
  height,
  onClick,
  onDragStart,
  onResizeDuration,
}) => {
  const [isResizing, setIsResizing] = useState(false);

  // Status mapping
  const status = appointment.status;
  let statusText = 'مؤكد';
  let cardClasses = 'bg-[#E8F5E9] text-emerald-950 border-r-emerald-500 hover:bg-[#D9EEDC]';

  if (status === 'waiting' || status === 'scheduled') {
    statusText = 'في الانتظار';
    cardClasses = 'bg-[#FFF3E0] text-amber-950 border-r-amber-500 hover:bg-[#FFE8CC]';
  } else if (status === 'cancelled' || status === 'no_show') {
    statusText = 'ملغى';
    cardClasses = 'bg-[#FFEBEE] text-rose-950 border-r-rose-500 hover:bg-[#FDD8DC]';
  } else if (status === 'completed') {
    statusText = 'مكتمل';
    cardClasses = 'bg-[#E3F2FD] text-blue-950 border-r-blue-500 hover:bg-[#D4E8FC]';
  } else if (status === 'in_progress') {
    statusText = 'جاري الكشف';
    cardClasses = 'bg-teal-50 text-teal-950 border-r-teal-500 hover:bg-teal-100/70';
  }

  const patientName = patient
    ? `${patient.first_name} ${patient.family_name}`
    : 'مريض';

  // Resize handler via pointer events
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    const startY = e.clientY;
    const startDuration = Math.round(
      (new Date(appointment.end_at).getTime() - new Date(appointment.start_at).getTime()) / 60000
    );

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      // 64px = 60 min -> ~1.066px per min, so each 16px is ~15 min
      const deltaMin = Math.round(deltaY / 16) * 15;
      const newDur = Math.max(15, Math.min(180, startDuration + deltaMin));
      if (newDur !== startDuration) {
        onResizeDuration?.(appointment, newDur);
      }
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      id={`appointment-card-${appointment.id}`}
      draggable
      onDragStart={(e) => onDragStart?.(e, appointment)}
      onClick={() => onClick?.(appointment)}
      style={{
        top: `${top}px`,
        height: `${height}px`,
      }}
      className={clsx(
        'absolute left-1 right-1 rounded-lg border-r-[3px] p-1.5 transition-shadow cursor-grab active:cursor-grabbing select-none overflow-hidden group shadow-sm z-10',
        cardClasses,
        isResizing && 'opacity-75 ring-2 ring-brand-blue'
      )}
      title={`${patientName} | ${procedureNames} - ${statusText}`}
    >
      <div className="flex items-start justify-between gap-1 h-full flex-col">
        {/* Line 1: Patient name (bold 12px) */}
        <div className="w-full flex items-center justify-between">
          <span className="text-[12px] font-bold truncate leading-tight">
            {patientName}
          </span>
          <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
        </div>

        {/* Line 2: Procedure - Status (11px) */}
        <div className="w-full text-[11px] font-medium opacity-90 truncate leading-tight">
          <span>{procedureNames}</span>
          <span className="mx-1 opacity-60">-</span>
          <span>{statusText}</span>
        </div>
      </div>

      {/* Resize Bottom Handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/5 hover:bg-black/10"
        title="اسحب لتعديل مدة الموعد"
      >
        <div className="w-6 h-0.5 bg-black/30 rounded-full" />
      </div>
    </div>
  );
};
