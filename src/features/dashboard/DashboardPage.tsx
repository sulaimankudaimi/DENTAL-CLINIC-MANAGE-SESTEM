import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { TodayStats } from './components/TodayStats';
import { TodayAppointmentsTable } from './components/TodayAppointmentsTable';
import { MiniCalendar } from './components/MiniCalendar';
import { RecentPatients } from './components/RecentPatients';
import { AppointmentDetailsDrawer } from './components/AppointmentDetailsDrawer';
import { useDashboard } from './hooks/useDashboard';
import { PatientFormModal } from '@/components/patients/PatientFormModal';
import { AppointmentFormModal } from '@/components/appointments/AppointmentFormModal';
import { PatientDetailsModal } from '@/components/patients/PatientDetailsModal';
import { InventoryAlertCards } from '@/features/inventory/InventoryAlertCards';
import { formatDateAr } from '@/lib/formatters';
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointment,
  CreatePatient,
} from '@shared/contracts';

export const DashboardPage: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    selectedDateStr,
    isTodaySelected,
    summary,
    isLoadingSummary,
    isErrorSummary,
    refetchSummary,
    appointments,
    isLoadingAppointments,
    isErrorAppointments,
    refetchAppointments,
    appointmentDaysInMonth,
    recentPatients,
    isLoadingPatients,
    isErrorPatients,
    refetchPatients,
    getPatient,
    getDentist,
    getProcedureName,
    updateAppointmentStatus,
    isUpdatingStatus,
    createAppointment,
    isCreatingAppointment,
    createPatient,
    isCreatingPatient,
  } = useDashboard();

  // Local state for modals & drawers
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);

  // Selected date formatted for title if not today
  const selectedDateFormatted = formatDateAr(selectedDate);

  // Handle appointment status transition from drawer
  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    await updateAppointmentStatus({ id, status });
    if (selectedAppointment && selectedAppointment.id === id) {
      setSelectedAppointment({
        ...selectedAppointment,
        status,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. عنوان الصفحة "لوحة اليوم" (PageHeader بدون أزرار) */}
      <PageHeader
        title="لوحة اليوم"
        description="متابعة فورية للمواعيد، حركة المرضى، والأداء المالي لعيادة اليوم"
      />

      {/* 2. صف بطاقات الإحصاء: 4 StatCard بترتيب من اليمين */}
      <TodayStats
        summary={summary}
        isLoading={isLoadingSummary}
        isError={isErrorSummary}
        onRetry={refetchSummary}
      />

      {/* 2b. تنبيهات المستودع والمخزون الطبي (أصناف قاربت النفاد وقاربت انتهاء الصلاحية) */}
      <InventoryAlertCards isDashboardWidget />

      {/* 3. شبكة 12 عموداً (RTL): العمود الأيمن 8/12 والعمود الأيسر 4/12 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* العمود الأيمن (8/12): بطاقة "جدول مواعيد اليوم" */}
        <div className="lg:col-span-8 space-y-6">
          <TodayAppointmentsTable
            appointments={appointments}
            isLoading={isLoadingAppointments}
            isError={isErrorAppointments}
            onRetry={refetchAppointments}
            onSelectAppointment={(appt) => setSelectedAppointment(appt)}
            onNewAppointmentClick={() => setIsNewAppointmentOpen(true)}
            onNewPatientClick={() => setIsNewPatientOpen(true)}
            getPatient={getPatient}
            getDentist={getDentist}
            getProcedureName={getProcedureName}
            isToday={isTodaySelected}
            selectedDateTitle={selectedDateFormatted}
          />
        </div>

        {/* العمود الأيسر (4/12) عمودياً: التقويم المصغّر + أحدث المرضى */}
        <div className="lg:col-span-4 space-y-6">
          {/* أ) تقويم شهري مصغّر */}
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={(newDate) => setSelectedDate(newDate)}
            appointmentDays={appointmentDaysInMonth}
          />

          {/* ب) بطاقة "أحدث المرضى المضافين" */}
          <RecentPatients
            patients={recentPatients}
            isLoading={isLoadingPatients}
            isError={isErrorPatients}
            onRetry={refetchPatients}
            onSelectPatient={(patientId) => setSelectedPatientId(patientId)}
            onNewPatientClick={() => setIsNewPatientOpen(true)}
            getDentist={getDentist}
          />
        </div>
      </div>

      {/* لوحة جانبية بتفاصيل الموعد (Appointment Details Drawer) */}
      <AppointmentDetailsDrawer
        appointment={selectedAppointment}
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        patient={selectedAppointment ? getPatient(selectedAppointment.patient_id) : undefined}
        dentist={selectedAppointment ? getDentist(selectedAppointment.dentist_id) : undefined}
        procedureName={selectedAppointment ? getProcedureName(selectedAppointment.procedure_ids) : ''}
        onStatusChange={handleStatusChange}
        onViewPatientRecord={(patientId) => {
          setSelectedAppointment(null);
          setSelectedPatientId(patientId);
        }}
        isUpdatingStatus={isUpdatingStatus}
      />

      {/* نافذة تسجيل مريض جديد */}
      <PatientFormModal
        isOpen={isNewPatientOpen}
        onClose={() => setIsNewPatientOpen(false)}
        onSubmit={async (data) => {
          await createPatient(data as CreatePatient);
          setIsNewPatientOpen(false);
        }}
        isLoading={isCreatingPatient}
      />

      {/* نافذة حجز موعد جديد */}
      <AppointmentFormModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        defaultDate={selectedDateStr}
        onSubmit={async (data) => {
          await createAppointment(data as CreateAppointment);
          setIsNewAppointmentOpen(false);
        }}
        isLoading={isCreatingAppointment}
      />

      {/* نافذة تفاصيل ملف المريض */}
      <PatientDetailsModal
        isOpen={!!selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
        patientId={selectedPatientId}
      />
    </div>
  );
};

export default DashboardPage;
