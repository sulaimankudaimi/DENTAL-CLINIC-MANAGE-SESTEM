import React, { useState } from 'react';
import type { Appointment, User, Room } from '@shared/contracts';
import { formatTime, formatDateAr } from '@/lib/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { APPOINTMENT_STATUS_AR } from '@shared/contracts';
import {
  Calendar,
  User as UserIcon,
  Plus,
  DoorOpen,
  CalendarCheck,
} from 'lucide-react';

export interface PatientAppointmentsTabProps {
  appointments: Appointment[];
  dentists: User[];
  rooms?: Room[];
  onBookAppointment: () => void;
  onUpdateStatus?: (appointmentId: string, status: any) => void;
}

export const PatientAppointmentsTab: React.FC<PatientAppointmentsTabProps> = ({
  appointments,
  dentists,
  rooms = [],
  onBookAppointment,
  onUpdateStatus,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const getDentistName = (id: string) => {
    const doc = dentists.find((d) => d.id === id);
    return doc ? doc.full_name : 'طبيب العيادة';
  };

  const getRoomName = (id: string | null) => {
    if (!id) return 'غرفة الكشف العامة';
    const r = rooms.find((room) => room.id === id);
    return r ? r.name : 'غرفة 1';
  };

  const filteredAppointments = [...appointments]
    .filter((a) => (filterStatus === 'all' ? true : a.status === filterStatus))
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

  return (
    <div id="patient-appointments-tab" className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-brand-navy" />
            سجل المواعيد والزيارات
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            عرض كافة الحجوزات السابقة والقادمة وتنظيم وصول المريض ومتابعة الجلسات
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 py-1.5 px-3 bg-white text-slate-700 outline-none focus:border-brand-navy"
          >
            <option value="all">كافة الحالات</option>
            <option value="scheduled">مجدول</option>
            <option value="confirmed">مؤكد</option>
            <option value="waiting">في الانتظار</option>
            <option value="in_progress">في العيادة</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>

          <Button
            variant="primary"
            size="sm"
            onClick={onBookAppointment}
            icon={<Plus className="w-4 h-4" />}
            className="text-xs"
          >
            حجز موعد جديد
          </Button>
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">لا توجد مواعيد مسجلة</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            لم يتم العثور على أي مواعيد لهذا المريض تطابق خيارات التصفية
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((appt) => {
            const dentistName = getDentistName(appt.dentist_id);
            const roomName = getRoomName(appt.room_id);
            const timeStr = formatTime(appt.start_at);
            const durationMin =
              Math.round(
                (new Date(appt.end_at).getTime() - new Date(appt.start_at).getTime()) / 60000
              ) || 30;

            const isUpcoming = new Date(appt.start_at) >= new Date();

            return (
              <div
                key={appt.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Time & Date */}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center w-16 h-14 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold shrink-0">
                    <span className="text-xs">{timeStr}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {durationMin} دقيقة
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {formatDateAr(appt.start_at)}
                      </span>
                      {isUpcoming && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-brand-navy font-semibold">
                          قادم
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        د. {dentistName}
                      </span>
                      <span className="flex items-center gap-1">
                        <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                        {roomName}
                      </span>
                    </div>

                    {appt.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        {appt.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 justify-end">
                  <Badge
                    variant={
                      appt.status === 'completed'
                        ? 'success'
                        : appt.status === 'in_progress'
                        ? 'default'
                        : appt.status === 'waiting'
                        ? 'warning'
                        : appt.status === 'cancelled'
                        ? 'danger'
                        : 'outline'
                    }
                  >
                    {APPOINTMENT_STATUS_AR[appt.status] || appt.status}
                  </Badge>

                  {onUpdateStatus && appt.status !== 'completed' && appt.status !== 'cancelled' && (
                    <div className="flex items-center gap-1.5">
                      {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => onUpdateStatus(appt.id, 'waiting')}
                        >
                          وصول
                        </Button>
                      )}
                      {appt.status === 'waiting' && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700 text-xs"
                          onClick={() => onUpdateStatus(appt.id, 'in_progress')}
                        >
                          إلى الكرسي
                        </Button>
                      )}
                      {appt.status === 'in_progress' && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                          onClick={() => onUpdateStatus(appt.id, 'completed')}
                        >
                          إنهاء
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
