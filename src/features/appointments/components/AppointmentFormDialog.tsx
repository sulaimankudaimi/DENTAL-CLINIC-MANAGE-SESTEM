import React, { useState, useEffect } from 'react';
import {
  Appointment,
  CreateAppointment,
  UpdateAppointment,
  Patient,
  User,
  Room,
  Procedure,
  AppointmentStatus,
  CreatePatient,
} from '@shared/contracts';
import { api } from '@/lib/api';
import { checkAppointmentConflict } from '../lib/conflicts';
import { formatArabicTime } from '../lib/slots';
import {
  X,
  Calendar,
  Clock,
  User as UserIcon,
  Search,
  Plus,
  AlertTriangle,
  Bell,
  Check,
} from 'lucide-react';
import clsx from 'clsx';

interface AppointmentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  defaultDateStr?: string;
  defaultStartAt?: string;
  defaultEndAt?: string;
  defaultDentistId?: string;
  patients: Patient[];
  dentists: User[];
  rooms: Room[];
  procedures: Procedure[];
  allAppointments: Appointment[];
  onSave: (payload: CreateAppointment | UpdateAppointment, isEdit: boolean) => Promise<void>;
  onPatientCreated?: (patient: Patient) => void;
}

export const AppointmentFormDialog: React.FC<AppointmentFormDialogProps> = ({
  isOpen,
  onClose,
  appointment,
  defaultDateStr,
  defaultStartAt,
  defaultEndAt,
  defaultDentistId,
  patients,
  dentists,
  rooms,
  procedures,
  allAppointments,
  onSave,
  onPatientCreated,
}) => {
  // Form fields
  const [patientId, setPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [dentistId, setDentistId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeHour, setTimeHour] = useState(8);
  const [timeMinute, setTimeMinute] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [status, setStatus] = useState<AppointmentStatus>('confirmed');
  const [notes, setNotes] = useState('');
  const [sendReminder, setSendReminder] = useState(true);

  // Quick Patient Create Sub-Form
  const [showQuickPatientForm, setShowQuickPatientForm] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState<'male' | 'female'>('male');
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);

  // Conflict state
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form on open
  useEffect(() => {
    if (!isOpen) return;

    setConflictError(null);
    setShowQuickPatientForm(false);

    if (appointment) {
      setPatientId(appointment.patient_id);
      setDentistId(appointment.dentist_id);
      setRoomId(appointment.room_id || '');
      setStatus(appointment.status);
      setNotes(appointment.notes || '');
      setSelectedProcedures(appointment.procedure_ids || []);

      const start = new Date(appointment.start_at);
      const end = new Date(appointment.end_at);
      setDateStr(start.toISOString().split('T')[0]);
      setTimeHour(start.getHours());
      setTimeMinute(start.getMinutes());
      const dur = Math.round((end.getTime() - start.getTime()) / 60000);
      setDurationMinutes(dur || 30);
    } else {
      const today = defaultDateStr || new Date().toISOString().split('T')[0];
      setDateStr(today);
      setPatientId('');
      setPatientSearch('');
      setDentistId(defaultDentistId || dentists[0]?.id || '');
      setRoomId(rooms[0]?.id || '');
      setStatus('confirmed');
      setNotes('');
      setSelectedProcedures([]);
      setSendReminder(true);

      if (defaultStartAt) {
        const start = new Date(defaultStartAt);
        setTimeHour(start.getHours());
        setTimeMinute(start.getMinutes());
        if (defaultEndAt) {
          const end = new Date(defaultEndAt);
          const dur = Math.round((end.getTime() - start.getTime()) / 60000);
          setDurationMinutes(dur || 30);
        } else {
          setDurationMinutes(30);
        }
      } else {
        setTimeHour(9);
        setTimeMinute(0);
        setDurationMinutes(30);
      }
    }
  }, [isOpen, appointment, defaultDateStr, defaultStartAt, defaultEndAt, defaultDentistId, dentists, rooms]);

  if (!isOpen) return null;

  // Filter patients by search
  const filteredPatients = patients.filter((p) => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase();
    return (
      p.first_name.toLowerCase().includes(q) ||
      p.family_name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.code.toLowerCase().includes(q)
    );
  });

  // Calculate procedure costs and durations
  const selectedProcObjects = procedures.filter((p) => selectedProcedures.includes(p.id));
  const totalCostHalalas = selectedProcObjects.reduce((acc, p) => acc + p.default_price_halalas, 0);
  const totalEstDuration = selectedProcObjects.reduce((acc, p) => acc + (p.default_duration_min || 30), 0);

  // Procedure multi-select toggle
  const toggleProcedure = (id: string) => {
    if (selectedProcedures.includes(id)) {
      setSelectedProcedures((prev) => prev.filter((x) => x !== id));
    } else {
      setSelectedProcedures((prev) => [...prev, id]);
      // Auto adjust duration if applicable
      const proc = procedures.find((p) => p.id === id);
      if (proc?.default_duration_min && selectedProcedures.length === 0) {
        setDurationMinutes(proc.default_duration_min);
      }
    }
  };

  // Quick Patient Submission
  const handleQuickCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newFamilyName.trim() || !newPhone.trim()) return;

    setIsCreatingPatient(true);
    try {
      const payload: CreatePatient = {
        clinic_id: 'c1000000-0000-0000-0000-000000000001',
        first_name: newFirstName.trim(),
        father_name: null,
        family_name: newFamilyName.trim(),
        gender: newGender,
        birth_date: null,
        national_id: null,
        phone: newPhone.trim(),
        phone_alt: null,
        email: null,
        address: null,
        city: 'الرياض',
        blood_type: 'unknown',
        marital_status: 'single',
        occupation: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        referral_source: null,
        primary_dentist_id: null,
        insurance_company_id: null,
        insurance_policy_no: null,
        insurance_expiry: null,
        notes: null,
        photo_path: null,
        is_active: true,
      };

      const res = await api.patients.create(payload);
      if (res.ok) {
        onPatientCreated?.(res.data);
        setPatientId(res.data.id);
        setShowQuickPatientForm(false);
        setNewFirstName('');
        setNewFamilyName('');
        setNewPhone('');
      }
    } catch (err: unknown) {
      console.error('Failed to create patient:', err);
    } finally {
      setIsCreatingPatient(false);
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    if (!patientId) {
      setConflictError('يرجى اختيار المريض أولاً');
      return;
    }
    if (!dentistId) {
      setConflictError('يرجى تحديد الطبيب المعالج');
      return;
    }
    if (!dateStr) {
      setConflictError('يرجى تحديد تاريخ الموعد');
      return;
    }

    const startDate = new Date(`${dateStr}T00:00:00`);
    startDate.setHours(timeHour, timeMinute, 0, 0);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    const startAt = startDate.toISOString();
    const endAt = endDate.toISOString();

    // Check conflicts
    const conflict = checkAppointmentConflict({
      appointmentId: appointment?.id,
      dentistId,
      roomId: roomId || null,
      startAt,
      endAt,
      existingAppointments: allAppointments,
      dentists,
      rooms,
      patients,
    });

    if (conflict.hasConflict) {
      setConflictError(conflict.message || 'يوجد تعارض في الموعد المحدد');
      return;
    }

    setIsSubmitting(true);
    try {
      if (appointment) {
        const payload: UpdateAppointment = {
          patient_id: patientId,
          dentist_id: dentistId,
          room_id: roomId || null,
          start_at: startAt,
          end_at: endAt,
          procedure_ids: selectedProcedures,
          status,
          notes: notes.trim() || null,
        };
        await onSave(payload, true);
      } else {
        const payload: CreateAppointment = {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          branch_id: 'b1000000-0000-0000-0000-000000000001',
          patient_id: patientId,
          dentist_id: dentistId,
          room_id: roomId || null,
          start_at: startAt,
          end_at: endAt,
          procedure_ids: selectedProcedures,
          status,
          source: 'walk_in',
          notes: notes.trim() || null,
          color_override: null,
          created_by: dentistId,
        };
        await onSave(payload, false);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setConflictError(err.message);
      } else {
        setConflictError('حدث خطأ أثناء حفظ الموعد');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-base font-bold text-text-primary">
              {appointment ? 'تعديل موعد' : 'إضافة موعد جديد'}
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">
              حدد بيانات المريض والطبيب والعيادة بدقة لتفادي أي تعارض في الجدول
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:bg-gray-200 hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Conflict Alert Banner */}
          {conflictError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{conflictError}</div>
            </div>
          )}

          {/* 1. Patient Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-brand-blue" />
                <span>المريض</span>
                <span className="text-rose-500">*</span>
              </label>
              {!showQuickPatientForm && (
                <button
                  type="button"
                  onClick={() => setShowQuickPatientForm(true)}
                  className="text-xs text-brand-blue font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>مريض جديد</span>
                </button>
              )}
            </div>

            {showQuickPatientForm ? (
              /* Inline New Patient Form */
              <div className="p-4 rounded-xl border border-brand-blue/30 bg-blue-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-blue">تسجيل مريض جديد فورياً</span>
                  <button
                    type="button"
                    onClick={() => setShowQuickPatientForm(false)}
                    className="text-xs text-text-tertiary hover:text-text-primary"
                  >
                    إلغاء
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="الاسم الأول *"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="text-xs px-3 py-2 rounded-lg border border-border-default bg-white focus:ring-1 focus:ring-brand-blue"
                  />
                  <input
                    type="text"
                    placeholder="اسم العائلة *"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    className="text-xs px-3 py-2 rounded-lg border border-border-default bg-white focus:ring-1 focus:ring-brand-blue"
                  />
                  <input
                    type="tel"
                    placeholder="رقم الجوال *"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="text-xs px-3 py-2 rounded-lg border border-border-default bg-white focus:ring-1 focus:ring-brand-blue"
                  />
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as 'male' | 'female')}
                    className="text-xs px-3 py-2 rounded-lg border border-border-default bg-white focus:ring-1 focus:ring-brand-blue"
                  >
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={isCreatingPatient || !newFirstName || !newFamilyName || !newPhone}
                    onClick={handleQuickCreatePatient}
                    className="px-3.5 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 disabled:opacity-50"
                  >
                    {isCreatingPatient ? 'جاري الحفظ...' : 'حفظ واختيار المريض'}
                  </button>
                </div>
              </div>
            ) : (
              /* Searchable Patient Selection */
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-text-tertiary absolute right-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="ابحث بالاسم أو رقم الجوال أو رقم الملف..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full text-xs pr-9 pl-3 py-2 rounded-lg border border-border-default focus:ring-1 focus:ring-brand-blue"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto border border-border-default/60 rounded-xl divide-y divide-gray-100 bg-white">
                  {filteredPatients.length === 0 ? (
                    <div className="p-3 text-center text-xs text-text-tertiary">
                      لا يوجد مريض مطابق للبحث
                    </div>
                  ) : (
                    filteredPatients.slice(0, 15).map((p) => {
                      const isSelected = p.id === patientId;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setPatientId(p.id);
                            setPatientSearch(`${p.first_name} ${p.family_name}`);
                          }}
                          className={clsx(
                            'p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors',
                            isSelected
                              ? 'bg-blue-50 text-brand-blue font-bold'
                              : 'hover:bg-gray-50 text-text-primary'
                          )}
                        >
                          <div>
                            <span>{p.first_name} {p.family_name}</span>
                            <span className="text-[11px] text-text-tertiary mr-2">({p.code})</span>
                          </div>
                          <span className="text-[11px] text-text-secondary">{p.phone}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Doctor and Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Doctor */}
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1.5">
                الطبيب المعالج <span className="text-rose-500">*</span>
              </label>
              <select
                value={dentistId}
                onChange={(e) => setDentistId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-border-default focus:ring-1 focus:ring-brand-blue"
              >
                {dentists.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} ({d.specialty || 'طبيب أسنان'})
                  </option>
                ))}
              </select>
            </div>

            {/* Room */}
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1.5">
                العيادة / الغرفة <span className="text-rose-500">*</span>
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-border-default focus:ring-1 focus:ring-brand-blue"
              >
                <option value="">-- بدون تحديد غرفة --</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} - ({r.status === 'free' ? 'شاغرة' : 'مشغولة'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Date, Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/70 p-3.5 rounded-xl border border-border-default/60">
            {/* Date */}
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-blue" />
                <span>التاريخ</span>
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-border-default bg-white focus:ring-1 focus:ring-brand-blue"
              />
            </div>

            {/* Time */}
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-blue" />
                <span>الوقت</span>
              </label>
              <div className="flex items-center gap-1">
                <select
                  value={timeHour}
                  onChange={(e) => setTimeHour(Number(e.target.value))}
                  className="w-1/2 text-xs px-2 py-1.5 rounded-lg border border-border-default bg-white focus:ring-1 focus:ring-brand-blue"
                >
                  {Array.from({ length: 13 }).map((_, i) => {
                    const h = 8 + i; // 8:00 to 20:00
                    return (
                      <option key={h} value={h}>
                        {formatArabicTime(h, 0)}
                      </option>
                    );
                  })}
                </select>
                <select
                  value={timeMinute}
                  onChange={(e) => setTimeMinute(Number(e.target.value))}
                  className="w-1/2 text-xs px-2 py-1.5 rounded-lg border border-border-default bg-white focus:ring-1 focus:ring-brand-blue"
                >
                  <option value={0}>00 د</option>
                  <option value={15}>15 د</option>
                  <option value={30}>30 د</option>
                  <option value={45}>45 د</option>
                </select>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                المدة المقدرة
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-border-default bg-white focus:ring-1 focus:ring-brand-blue"
              >
                <option value={15}>15 دقيقة</option>
                <option value={30}>30 دقيقة</option>
                <option value={45}>45 دقيقة</option>
                <option value={60}>60 دقيقة (ساعة)</option>
                <option value={90}>90 دقيقة (ساعة ونصف)</option>
                <option value={120}>120 دقيقة (ساعتان)</option>
              </select>
            </div>
          </div>

          {/* 4. Procedures Multi-Select */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-text-primary">
                الإجراءات المتوقعة (متعدد)
              </label>
              {selectedProcedures.length > 0 && (
                <div className="text-[11px] text-text-secondary flex items-center gap-2">
                  <span>المدة المقترحة: <strong className="text-text-primary">{totalEstDuration} د</strong></span>
                  <span>•</span>
                  <span>التكلفة التقديرية: <strong className="text-brand-blue">{(totalCostHalalas / 100).toFixed(0)} ر.س</strong></span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 border border-border-default/60 rounded-xl bg-gray-50/40">
              {procedures.slice(0, 20).map((proc) => {
                const isSelected = selectedProcedures.includes(proc.id);
                return (
                  <button
                    key={proc.id}
                    type="button"
                    onClick={() => toggleProcedure(proc.id)}
                    className={clsx(
                      'text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 select-none',
                      isSelected
                        ? 'bg-brand-blue text-white border-brand-blue'
                        : 'bg-white text-text-secondary border-border-default hover:border-gray-300'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{proc.name_ar || proc.name_en || 'إجراء'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Status & Reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Status */}
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1.5">
                حالة الموعد
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-border-default focus:ring-1 focus:ring-brand-blue"
              >
                <option value="confirmed">مؤكد (Confirmed)</option>
                <option value="waiting">في الانتظار (Waiting)</option>
                <option value="scheduled">مجدول (Scheduled)</option>
                <option value="in_progress">جاري الكشف (In Progress)</option>
                <option value="completed">مكتمل (Completed)</option>
                <option value="cancelled">ملغي (Cancelled)</option>
              </select>
            </div>

            {/* Reminder Checkbox */}
            <div className="pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendReminder}
                  onChange={(e) => setSendReminder(e.target.checked)}
                  className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                />
                <span className="text-xs font-medium text-text-secondary flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  <span>إرسال تذكير تلقائي قبل 24 ساعة (SMS / واتساب)</span>
                </span>
              </label>
            </div>
          </div>

          {/* 6. Notes */}
          <div>
            <label className="text-xs font-bold text-text-primary block mb-1">
              ملاحظات إضافية
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي تفاصيل خاصة بالحالة، تفضيلات المريض، أو متطلبات التعقيم..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-border-default focus:ring-1 focus:ring-brand-blue"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-border-default flex items-center justify-between bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-gray-200 transition-colors"
          >
            إلغاء
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-6 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue/90 shadow-sm transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'جاري الحفظ...' : appointment ? 'تحديث الموعد' : 'تأكيد الحجز'}
          </button>
        </div>
      </div>
    </div>
  );
};
