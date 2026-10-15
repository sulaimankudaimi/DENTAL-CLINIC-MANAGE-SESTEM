import React, { useState } from 'react';
import {
  Appointment,
  Patient,
  User,
  Room,
  Procedure,
} from '@shared/contracts';
import { DayInfo, HOUR_HEIGHT, getCalendarConfig, pixelOffsetToTime } from '../lib/slots';
import { TimeGutter } from './TimeGutter';
import { DayColumn } from './DayColumn';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';

interface WeekCalendarProps {
  weekDays: DayInfo[];
  appointmentsByDay: Record<string, Appointment[]>;
  allAppointments?: Appointment[];
  patientsMap: Map<string, Patient>;
  dentistsMap?: Map<string, User>;
  roomsMap?: Map<string, Room>;
  proceduresMap: Map<string, Procedure>;
  dentists: User[];
  rooms: Room[];
  selectedDentist: string;
  onChangeDentist: (id: string) => void;
  selectedRoom: string;
  onChangeRoom: (id: string) => void;
  onNavigatePrevWeek: () => void;
  onNavigateNextWeek: () => void;
  onNavigateToday: () => void;
  onAddNewAppointment: () => void;
  onAddNewPatient: () => void;
  onAppointmentClick: (appt: Appointment) => void;
  onSlotClick: (dateStr: string, startAt: string, endAt: string, dutyDoctorId?: string) => void;
  onMoveAppointment: (apptId: string, newStartAt: string, newEndAt: string) => Promise<void>;
  onResizeDuration: (appt: Appointment, newDurationMin: number) => void;
  unconfirmedCount?: number;
  onOpenWaitingList?: () => void;
}

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
  weekDays,
  appointmentsByDay,
  patientsMap,
  proceduresMap,
  dentists,
  rooms,
  selectedDentist,
  onChangeDentist,
  selectedRoom,
  onChangeRoom,
  onNavigatePrevWeek,
  onNavigateNextWeek,
  onNavigateToday,
  onAddNewAppointment,
  onAddNewPatient,
  onAppointmentClick,
  onSlotClick,
  onMoveAppointment,
  onResizeDuration,
  unconfirmedCount = 0,
  onOpenWaitingList,
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [draggedAppt, setDraggedAppt] = useState<Appointment | null>(null);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, appt: Appointment) => {
    setDraggedAppt(appt);
    e.dataTransfer.setData('text/plain', appt.id);
  };

  const handleDropOnDay = async (targetDateStr: string, targetYPx: number) => {
    if (!draggedAppt) return;

    // Calculate current duration
    const currentDurationMs =
      new Date(draggedAppt.end_at).getTime() - new Date(draggedAppt.start_at).getTime();
    const durationMin = Math.round(currentDurationMs / 60000) || 30;

    const calConfig = getCalendarConfig();
    const { startAt, endAt } = pixelOffsetToTime(
      targetDateStr,
      targetYPx,
      durationMin,
      calConfig.startHour,
      HOUR_HEIGHT
    );

    try {
      await onMoveAppointment(draggedAppt.id, startAt, endAt);
    } catch {
      // Revert is handled automatically via query rollback in mutations hook
    } finally {
      setDraggedAppt(null);
    }
  };

  // Week range label
  const firstDay = weekDays[0];
  const lastDay = weekDays[weekDays.length - 1];
  const weekRangeLabel = firstDay && lastDay
    ? `${firstDay.dayNumber} ${firstDay.monthNameAr} - ${lastDay.dayNumber} ${lastDay.monthNameAr} ${firstDay.date.getFullYear()}`
    : '';

  return (
    <div
      id="weekly-calendar-card"
      className="bg-white rounded-2xl border border-border-default shadow-sm overflow-hidden flex flex-col"
      dir="rtl"
    >
      {/* 1. Header Toolbar matching screenshot */}
      <div className="p-4 border-b border-border-default flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white">
        {/* Right side: Title / Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-border-default/60 rounded-xl p-1">
            <button
              onClick={onNavigatePrevWeek}
              className="p-1 rounded-lg text-text-secondary hover:bg-white hover:text-text-primary transition-colors"
              title="الأسبوع السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateToday}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-brand-blue hover:bg-white transition-colors"
            >
              اليوم
            </button>
            <button
              onClick={onNavigateNextWeek}
              className="p-1 rounded-lg text-text-secondary hover:bg-white hover:text-text-primary transition-colors"
              title="الأسبوع القادم"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <span className="text-sm font-bold text-text-primary tracking-tight">
            {weekRangeLabel}
          </span>

          {unconfirmedCount > 0 && (
            <button
              onClick={onOpenWaitingList}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>مواعيد غير محددة تحتاج تأكيد ({unconfirmedCount})</span>
            </button>
          )}
        </div>

        {/* Center / Left Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View switcher: يوم | أسبوع | شهر */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-border-default/60 text-xs font-semibold select-none">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={clsx(
                'px-3 py-1 rounded-lg transition-all',
                viewMode === 'day' ? 'bg-white text-brand-blue shadow-xs' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              يوم
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={clsx(
                'px-3 py-1 rounded-lg transition-all',
                viewMode === 'week' ? 'bg-white text-brand-blue shadow-xs' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              أسبوع
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={clsx(
                'px-3 py-1 rounded-lg transition-all',
                viewMode === 'month' ? 'bg-white text-brand-blue shadow-xs' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              شهر
            </button>
          </div>

          {/* Filters: Doctors & Rooms */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedDentist}
              onChange={(e) => onChangeDentist(e.target.value)}
              className="text-xs bg-gray-50 border border-border-default text-text-primary px-2.5 py-1.5 rounded-xl focus:ring-1 focus:ring-brand-blue"
            >
              <option value="all">كل الأطباء</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>

            <select
              value={selectedRoom}
              onChange={(e) => onChangeRoom(e.target.value)}
              className="text-xs bg-gray-50 border border-border-default text-text-primary px-2.5 py-1.5 rounded-xl focus:ring-1 focus:ring-brand-blue"
            >
              <option value="all">كل الغرف</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons: إضافة موعد جديد + مريض جديد */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="add-appointment-btn"
              onClick={onAddNewAppointment}
              className="px-3.5 py-1.5 rounded-xl border border-brand-blue text-brand-blue hover:bg-blue-50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة موعد جديد</span>
            </button>

            <button
              type="button"
              id="add-patient-btn"
              onClick={onAddNewPatient}
              className="px-3.5 py-1.5 rounded-xl bg-brand-blue text-white hover:bg-brand-blue/90 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>مريض جديد</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Calendar Grid Area */}
      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[700px] flex">
        {/* Right Time Gutter */}
        <TimeGutter />

        {/* Days Columns */}
        <div className="flex-1 flex min-w-[700px]">
          {weekDays.map((day) => (
            <DayColumn
              key={day.dateStr}
              day={day}
              appointments={appointmentsByDay[day.dateStr] || []}
              patientsMap={patientsMap}
              proceduresMap={proceduresMap}
              onAppointmentClick={onAppointmentClick}
              onSlotClick={onSlotClick}
              onDragStartAppt={handleDragStart}
              onDropAppt={handleDropOnDay}
              onResizeDuration={onResizeDuration}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
