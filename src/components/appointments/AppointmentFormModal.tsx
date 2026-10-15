import React, { useState, useEffect } from 'react';
import type { Appointment, CreateAppointment, UpdateAppointment, Procedure } from '@shared/contracts';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { AlertCircle } from 'lucide-react';

export interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAppointment | UpdateAppointment) => Promise<void>;
  appointment?: Appointment | null;
  defaultPatientId?: string;
  defaultDate?: string;
  isLoading?: boolean;
}

export const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  appointment,
  defaultPatientId,
  defaultDate,
  isLoading = false,
}) => {
  const isEdit = !!appointment;

  const [patientId, setPatientId] = useState('');
  const [dentistId, setDentistId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [procedureId, setProcedureId] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Appointment['status']>('scheduled');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch patients
  const { data: patients = [] } = useQuery({
    queryKey: queryKeys.patients.all,
    queryFn: async () => {
      const res = await api.patients.list({ page: 1, limit: 100, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
    enabled: isOpen,
  });

  // Fetch dentists
  const { data: dentists = [] } = useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: async () => {
      const res = await api.staff.list({ role: 'dentist', page: 1, limit: 100, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
    enabled: isOpen,
  });

  // Fetch procedures
  const { data: procedures = [] } = useQuery<Procedure[]>({
    queryKey: queryKeys.treatments.procedures(),
    queryFn: async () => {
      const res = await api.treatments.getProcedures({ page: 1, limit: 100, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (appointment) {
      setPatientId(appointment.patient_id);
      setDentistId(appointment.dentist_id);
      setDate(appointment.start_at ? appointment.start_at.split('T')[0] : '');
      const timePart = appointment.start_at?.split('T')[1] || '09:00';
      setStartTime(timePart.substring(0, 5));
      const dur = appointment.start_at && appointment.end_at
        ? Math.round((new Date(appointment.end_at).getTime() - new Date(appointment.start_at).getTime()) / 60000)
        : 30;
      setDurationMinutes(dur > 0 ? dur : 30);
      setProcedureId(
        Array.isArray(appointment.procedure_ids)
          ? appointment.procedure_ids[0] || ''
          : (appointment.procedure_ids as unknown as string) || ''
      );
      setNotes(appointment.notes || '');
      setStatus(appointment.status);
    } else {
      setPatientId(defaultPatientId || (patients[0]?.id ?? ''));
      setDentistId(dentists[0]?.id ?? '');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setStartTime('10:00');
      setDurationMinutes(30);
      setProcedureId(procedures[0]?.id ?? '');
      setNotes('');
      setStatus('scheduled');
    }
    setErrorMsg(null);
  }, [appointment, isOpen, defaultPatientId, defaultDate, patients, dentists, procedures]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setErrorMsg('يرجى اختيار المريض');
      return;
    }
    if (!dentistId) {
      setErrorMsg('يرجى اختيار الطبيب المعالج');
      return;
    }
    if (!date) {
      setErrorMsg('يرجى تحديد تاريخ الموعد');
      return;
    }

    try {
      const startDateTime = `${date}T${startTime}:00Z`;
      const endD = new Date(new Date(startDateTime).getTime() + durationMinutes * 60 * 1000);
      const endDateTime = endD.toISOString();

      const payload: CreateAppointment = {
        clinic_id: 'c1000000-0000-0000-0000-000000000001',
        branch_id: 'b1000000-0000-0000-0000-000000000001',
        patient_id: patientId,
        dentist_id: dentistId,
        room_id: null,
        start_at: startDateTime,
        end_at: endDateTime,
        status,
        source: 'phone',
        color_override: null,
        procedure_ids: procedureId ? [procedureId] : [],
        notes: notes.trim() || null,
        created_by: dentistId,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الموعد');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'تعديل بيانات الموعد' : 'حجز موعد جديد'}
      description="جدولة موعد في العيادة وتحديد الإجراء الطبي والطبيب المختص"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="المريض *"
            value={patientId}
            onValueChange={(val) => setPatientId(val)}
            options={patients.map((p) => ({
              label: `${p.first_name} ${p.family_name} (${p.code})`,
              value: p.id,
            }))}
            required
          />

          <Select
            label="الطبيب المعالج *"
            value={dentistId}
            onValueChange={(val) => setDentistId(val)}
            options={dentists.map((d) => ({
              label: `د. ${d.full_name}`,
              value: d.id,
            }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="تاريخ الموعد *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            label="وقت البدء *"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />

          <Select
            label="المدة المتوقعة"
            value={durationMinutes.toString()}
            onValueChange={(val) => setDurationMinutes(Number(val))}
            options={[
              { label: '15 دقيقة', value: '15' },
              { label: '30 دقيقة (افتراضي)', value: '30' },
              { label: '45 دقيقة', value: '45' },
              { label: '60 دقيقة (ساعة)', value: '60' },
              { label: '90 دقيقة', value: '90' },
            ]}
          />
        </div>

        <Select
          label="الإجراء الطبي المخطط"
          value={procedureId}
          onValueChange={(val) => setProcedureId(val)}
          options={[
            { label: '— كشف عام / فحص دوري —', value: '' },
            ...procedures.map((proc) => ({
              label: `${proc.name_ar} (${proc.code})`,
              value: proc.id,
            })),
          ]}
        />

        {isEdit && (
          <Select
            label="حالة الموعد"
            value={status}
            onValueChange={(val) => setStatus(val as Appointment['status'])}
            options={[
              { label: 'مجدول (Scheduled)', value: 'scheduled' },
              { label: 'مؤكد (Confirmed)', value: 'confirmed' },
              { label: 'في الانتظار (Waiting)', value: 'waiting' },
              { label: 'في غرفة العلاج (In Progress)', value: 'in_progress' },
              { label: 'مكتمل (Completed)', value: 'completed' },
              { label: 'لم يحضر (No Show)', value: 'no_show' },
              { label: 'ملغي (Cancelled)', value: 'cancelled' },
            ]}
          />
        )}

        <Textarea
          label="ملاحظات سريرية أو إدارية"
          placeholder="أي تعليمات أو تفاصيل إضافية خاصة بالموعد..."
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            {isEdit ? 'حفظ التعديلات' : 'تأكيد حجز الموعد'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AppointmentFormModal;
