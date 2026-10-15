import React from 'react';
import { Calendar, UserPlus, Plus, Clock, AlertCircle, RefreshCw, CalendarX } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatTime } from '@/lib/formatters';
import type {
  Appointment,
  AppointmentStatus,
  Patient,
  User,
} from '@shared/contracts';
import { APPOINTMENT_STATUS_AR } from '@shared/contracts';

export interface TodayAppointmentsTableProps {
  appointments: Appointment[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onNewAppointmentClick: () => void;
  onNewPatientClick: () => void;
  getPatient: (patientId: string) => Patient | undefined;
  getDentist: (dentistId: string) => User | undefined;
  getProcedureName: (procedureIds: string[]) => string;
  isToday: boolean;
  selectedDateTitle?: string;
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

export const TodayAppointmentsTable: React.FC<TodayAppointmentsTableProps> = ({
  appointments,
  isLoading,
  isError,
  onRetry,
  onSelectAppointment,
  onNewAppointmentClick,
  onNewPatientClick,
  getPatient,
  getDentist,
  getProcedureName,
  isToday,
  selectedDateTitle,
}) => {
  // Define columns in RTL order: الوقت | اسم المريض | الإجراء | الطبيب | الحالة
  const columns: Column<Appointment>[] = [
    {
      key: 'start_at',
      header: 'الوقت',
      width: '120px',
      render: (item) => (
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-text-primary">
          <Clock className="w-3.5 h-3.5 text-brand-blue shrink-0" />
          <span dir="ltr">{formatTime(item.start_at)}</span>
        </div>
      ),
    },
    {
      key: 'patient_name',
      header: 'اسم المريض',
      render: (item) => {
        const patient = getPatient(item.patient_id);
        const fullName = patient
          ? [patient.first_name, patient.father_name, patient.family_name].filter(Boolean).join(' ')
          : 'مريض غير مسجل';
        return (
          <div className="flex flex-col">
            <span className="font-bold text-text-primary hover:text-brand-blue transition-colors">
              {fullName}
            </span>
            {patient?.code && (
              <span className="text-[11px] font-mono text-text-muted">
                {patient.code}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'procedure',
      header: 'الإجراء',
      render: (item) => (
        <span className="text-xs text-text-secondary font-medium truncate max-w-[180px] block">
          {getProcedureName(item.procedure_ids)}
        </span>
      ),
    },
    {
      key: 'dentist',
      header: 'الطبيب',
      render: (item) => {
        const dentist = getDentist(item.dentist_id);
        return (
          <span className="text-xs font-semibold text-text-primary">
            {dentist ? `د. ${dentist.full_name}` : '—'}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'الحالة',
      width: '130px',
      align: 'center',
      render: (item) => (
        <Badge variant={statusBadgeVariantMap[item.status]} dot size="sm">
          {APPOINTMENT_STATUS_AR[item.status]}
        </Badge>
      ),
    },
  ];

  const headerTitle = isToday ? 'جدول مواعيد اليوم' : `جدول مواعيد ${selectedDateTitle || ''}`;

  return (
    <Card className="flex flex-col overflow-hidden border border-surface-border shadow-card">
      {/* Card Header: Title on right, Actions on left (RTL) */}
      <div className="p-4 sm:px-6 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-blue shrink-0" />
          <h2 className="text-base font-bold text-text-primary leading-tight">
            {headerTitle}
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-surface-hover text-text-secondary border border-surface-border">
            {appointments.length}
          </span>
        </div>

        {/* Action Buttons: secondary (إضافة موعد جديد) + primary (مريض جديد) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={onNewAppointmentClick}
            icon={<Plus className="w-4 h-4 text-text-secondary" />}
          >
            إضافة موعد جديد
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onNewPatientClick}
            icon={<UserPlus className="w-4 h-4" />}
          >
            مريض جديد
          </Button>
        </div>
      </div>

      {/* Card Body: Table / Skeletons / Empty / Error */}
      <div className="flex-1 p-0">
        {isError ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-status-danger-bg flex items-center justify-center text-status-danger-fg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-text-primary">
              تعذر تحميل جدول المواعيد
            </p>
            <p className="text-xs text-text-secondary max-w-sm">
              حدث خطأ أثناء استرجاع بيانات المواعيد من قاعدة البيانات.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetry}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="mt-2"
            >
              إعادة المحاولة
            </Button>
          </div>
        ) : !isLoading && appointments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<CalendarX className="w-7 h-7 text-text-muted" />}
              title="لا توجد مواعيد اليوم"
              description="لم يتم تسجيل أو جدولة أي مواعيد لهذا اليوم حتى الآن. يمكنك إضافة موعد جديد مباشرة."
              actionText="إضافة موعد جديد"
              onAction={onNewAppointmentClick}
              actionIcon={<Plus className="w-4 h-4" />}
            />
          </div>
        ) : (
          <DataTable<Appointment>
            columns={columns}
            data={appointments}
            keyExtractor={(item) => item.id}
            loading={isLoading}
            onRowClick={onSelectAppointment}
            className="border-0 shadow-none rounded-none"
          />
        )}
      </div>
    </Card>
  );
};
