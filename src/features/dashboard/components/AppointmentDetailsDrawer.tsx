import React, { useEffect } from 'react';
import {
  X,
  Clock,
  Calendar as CalendarIcon,
  User as UserIcon,
  Phone,
  Stethoscope,
  Building,
  FileText,
  CheckCircle2,
  PlayCircle,
  Clock3,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatTime, formatDateAr } from '@/lib/formatters';
import type {
  Appointment,
  AppointmentStatus,
  Patient,
  User,
} from '@shared/contracts';
import {
  APPOINTMENT_STATUS_AR,
  APPOINTMENT_SOURCE_AR,
} from '@shared/contracts';

export interface AppointmentDetailsDrawerProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | undefined;
  dentist: User | undefined;
  procedureName: string;
  onStatusChange: (id: string, status: AppointmentStatus) => Promise<unknown>;
  onViewPatientRecord: (patientId: string) => void;
  isUpdatingStatus?: boolean;
}

const statusBadgeVariantMap: Record<AppointmentStatus, 'ok' | 'warn' | 'danger' | 'info' | 'neutral'> = {
  completed: 'ok',
  in_progress: 'info',
  waiting: 'warn',
  confirmed: 'info',
  scheduled: 'neutral',
  cancelled: 'danger',
  no_show: 'danger',
};

export const AppointmentDetailsDrawer: React.FC<AppointmentDetailsDrawerProps> = ({
  appointment,
  isOpen,
  onClose,
  patient,
  dentist,
  procedureName,
  onStatusChange,
  onViewPatientRecord,
  isUpdatingStatus = false,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !appointment) return null;

  const patientFullName = patient
    ? [patient.first_name, patient.father_name, patient.family_name].filter(Boolean).join(' ')
    : 'مريض غير مسجل';

  const appointmentDate = new Date(appointment.start_at);
  const formattedDate = formatDateAr(appointmentDate);
  const startTime = formatTime(appointment.start_at);
  const endTime = formatTime(appointment.end_at);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container (slides from start/right in RTL) */}
      <div className="fixed inset-y-0 start-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white border-e border-surface-border shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-out">
          {/* Header */}
          <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-surface-app/50">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-brand-blue" />
              <h2 className="text-base font-bold text-text-primary">تفاصيل الموعد</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
              aria-label="إغلاق اللوحة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Patient Card Banner */}
            <div className="p-4 rounded-xl bg-surface-app border border-surface-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  size="md"
                  fallback={patient?.first_name?.charAt(0) || 'م'}
                  className="shrink-0 border border-surface-border"
                />
                <div className="flex flex-col min-w-0">
                  <h3 className="text-sm font-bold text-text-primary truncate">
                    {patientFullName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    {patient?.code && (
                      <span className="font-mono font-semibold text-brand-navy">
                        {patient.code}
                      </span>
                    )}
                    {patient?.phone && (
                      <span dir="ltr" className="text-text-muted flex items-center gap-1">
                        <Phone className="w-3 h-3 inline text-text-muted" />
                        <span>{patient.phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {patient && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewPatientRecord(patient.id)}
                  className="text-xs text-brand-blue hover:text-brand-navy-deep shrink-0 gap-1 px-2"
                >
                  <span>الملف</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {/* Status & Timing */}
            <div className="p-4 rounded-xl bg-white border border-surface-border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary">حالة الموعد</span>
                <Badge variant={statusBadgeVariantMap[appointment.status]} dot size="md">
                  {APPOINTMENT_STATUS_AR[appointment.status]}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-primary font-medium pt-1 border-t border-surface-divider">
                <Clock className="w-4 h-4 text-brand-blue shrink-0" />
                <span>الوقت:</span>
                <span dir="ltr" className="font-mono font-bold text-brand-navy">
                  {startTime} - {endTime}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <CalendarIcon className="w-4 h-4 text-text-muted shrink-0" />
                <span>التاريخ:</span>
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Clinical & Appointment Details */}
            <div className="p-4 rounded-xl bg-white border border-surface-border shadow-xs space-y-3.5">
              <div className="flex items-start gap-3">
                <Stethoscope className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[11px] font-semibold text-text-secondary">الإجراء المطلوب</span>
                  <span className="text-xs font-bold text-text-primary">{procedureName}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <UserIcon className="w-4 h-4 text-brand-teal mt-0.5 shrink-0" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[11px] font-semibold text-text-secondary">الطبيب المعالج</span>
                  <span className="text-xs font-bold text-text-primary">
                    {dentist ? `د. ${dentist.full_name}` : 'غير محدد'}
                  </span>
                  {dentist?.specialty && (
                    <span className="text-[11px] text-text-muted">{dentist.specialty}</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[11px] font-semibold text-text-secondary">مصدر الحجز</span>
                  <span className="text-xs text-text-primary">
                    {APPOINTMENT_SOURCE_AR[appointment.source] || 'حضور مباشر للعيادة'}
                  </span>
                </div>
              </div>

              {appointment.notes && (
                <div className="flex items-start gap-3 pt-2 border-t border-surface-divider">
                  <FileText className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[11px] font-semibold text-text-secondary">ملاحظات الموعد</span>
                    <p className="text-xs text-text-primary leading-relaxed bg-surface-app p-2 rounded-lg border border-surface-border">
                      {appointment.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions for Appointment State Transitions */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-text-secondary block mb-2">
                تحديث حالة الموعد:
              </span>

              <div className="grid grid-cols-2 gap-2">
                {appointment.status !== 'in_progress' && appointment.status !== 'completed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={isUpdatingStatus}
                    onClick={() => onStatusChange(appointment.id, 'in_progress')}
                    icon={<PlayCircle className="w-4 h-4" />}
                    className="bg-brand-blue hover:bg-brand-navy-deep"
                  >
                    بدء الجلسة
                  </Button>
                )}

                {appointment.status !== 'completed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={isUpdatingStatus}
                    onClick={() => onStatusChange(appointment.id, 'completed')}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    className="bg-status-ok-fg hover:opacity-90"
                  >
                    إتمام الموعد
                  </Button>
                )}

                {appointment.status !== 'waiting' &&
                  appointment.status !== 'completed' &&
                  appointment.status !== 'cancelled' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={isUpdatingStatus}
                      onClick={() => onStatusChange(appointment.id, 'waiting')}
                      icon={<Clock3 className="w-4 h-4" />}
                    >
                      صالة الانتظار
                    </Button>
                  )}

                {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                  <Button
                    variant="danger"
                    size="sm"
                    loading={isUpdatingStatus}
                    onClick={() => onStatusChange(appointment.id, 'cancelled')}
                    icon={<XCircle className="w-4 h-4" />}
                  >
                    إلغاء الموعد
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-surface-border bg-white flex items-center justify-between">
            <span className="text-[11px] text-text-muted">
              معرف الموعد: <span className="font-mono">{appointment.id.slice(0, 8)}...</span>
            </span>
            <Button variant="secondary" size="sm" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
