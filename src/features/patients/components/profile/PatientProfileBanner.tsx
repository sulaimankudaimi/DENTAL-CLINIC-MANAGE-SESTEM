import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Patient, User, MedicalHistory, Allergy } from '@shared/contracts';
import {
  GENDER_AR,
  BLOOD_TYPE_AR,
  MEDICAL_CONDITION_KEY_AR,
  ALLERGY_SEVERITY_AR,
} from '@shared/contracts';
import {
  ArrowRight,
  Phone,
  CreditCard,
  CalendarPlus,
  Receipt,
  Edit2,
  Printer,
  AlertTriangle,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';

export interface PatientProfileBannerProps {
  patient: Patient;
  attendingDentist?: User | null;
  medicalHistory?: MedicalHistory[];
  allergies?: Allergy[];
  onBookAppointment: () => void;
  onCreateInvoice: () => void;
  onEditPatient: () => void;
}

export const PatientProfileBanner: React.FC<PatientProfileBannerProps> = ({
  patient,
  attendingDentist,
  medicalHistory = [],
  allergies = [],
  onBookAppointment,
  onCreateInvoice,
  onEditPatient,
}) => {
  const navigate = useNavigate();

  // Calculate age
  const calculateAge = (dobString: string | null): number => {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const age = calculateAge(patient.birth_date);
  const fullName = `${patient.first_name} ${patient.family_name}`;
  const genderLabel = GENDER_AR[patient.gender] || patient.gender;
  const bloodTypeLabel = patient.blood_type ? BLOOD_TYPE_AR[patient.blood_type] : null;

  // Filter severe alerts
  const criticalAllergies = allergies.filter((a) => a.severity === 'severe');
  const activeConditions = medicalHistory.filter((m) => m.has_condition);

  return (
    <div id="patient-profile-banner" className="space-y-3">
      {/* Top Navigation & Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-navy hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة لقائمة المرضى
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer className="w-3.5 h-3.5" />}
            className="text-xs print:hidden"
          >
            طباعة الملف
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onEditPatient}
            icon={<Edit2 className="w-3.5 h-3.5" />}
            className="text-xs print:hidden"
          >
            تعديل البيانات
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onCreateInvoice}
            icon={<Receipt className="w-3.5 h-3.5 text-emerald-600" />}
            className="text-xs print:hidden hover:border-emerald-500 hover:text-emerald-700"
          >
            إصدار فاتورة
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onBookAppointment}
            icon={<CalendarPlus className="w-3.5 h-3.5" />}
            className="text-xs print:hidden shadow-sm"
          >
            حجز موعد جديد
          </Button>
        </div>
      </div>

      {/* Main Header Gradient Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C1D38] via-[#12315D] to-[#1E4E9C] text-white p-6 shadow-md border border-slate-700/50">
        {/* Subtle decorative geometric overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Patient Details & Avatar */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <Avatar
                name={fullName}
                size="xl"
                className="w-20 h-20 text-2xl font-bold border-2 border-white/30 shadow-lg bg-teal-600 text-white"
              />
              <span
                className={`absolute bottom-0 left-0 w-5 h-5 rounded-full border-2 border-[#0C1D38] ${
                  patient.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
                title={patient.is_active ? 'مريض نشط' : 'ملف غير نشط'}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
                  {fullName}
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/15 text-white/90 border border-white/20 font-bold">
                  {patient.code}
                </span>
                <Badge
                  variant={patient.is_active ? 'success' : 'neutral'}
                  className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px]"
                >
                  {patient.is_active ? 'نشط' : 'مؤرشف'}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-200">
                <span>{genderLabel}</span>
                <span className="text-slate-400">•</span>
                <span>{age} سنة</span>
                <span className="text-slate-400">•</span>
                <span className="font-mono" dir="ltr">
                  {patient.birth_date}
                </span>
                {patient.national_id && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <CreditCard className="w-3 h-3 text-slate-300" />
                      {patient.national_id}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={`tel:${patient.phone}`}
                  className="inline-flex items-center gap-1.5 text-xs text-teal-200 bg-teal-950/40 hover:bg-teal-900/60 px-2.5 py-1 rounded-lg border border-teal-500/30 transition-colors font-mono"
                  dir="ltr"
                >
                  <Phone className="w-3.5 h-3.5 text-teal-400" />
                  {patient.phone}
                </a>

                {bloodTypeLabel && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-rose-900/50 text-rose-200 border border-rose-500/30">
                    <HeartPulse className="w-3 h-3 text-rose-400" />
                    فصيلة الدم: {bloodTypeLabel}
                  </span>
                )}

                {patient.emergency_contact_phone && (
                  <span className="text-xs text-slate-300 bg-white/10 px-2 py-1 rounded-md">
                    طوارئ: {patient.emergency_contact_name || ''} ({patient.emergency_contact_phone})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Attending Doctor Badge */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/15 shrink-0 min-w-[240px]">
            <Avatar
              name={attendingDentist ? attendingDentist.full_name : 'دكتور'}
              size="md"
              className="bg-brand-navy border border-white/20 text-white"
            />
            <div className="space-y-0.5">
              <span className="text-[11px] text-teal-300 font-semibold block flex items-center gap-1">
                <Stethoscope className="w-3 h-3" />
                الطبيب المعالج المسؤول
              </span>
              <p className="font-bold text-sm text-white">
                {attendingDentist ? `د. ${attendingDentist.full_name}` : 'غير محدد حالياً'}
              </p>
              <p className="text-[11px] text-slate-300">
                {attendingDentist?.specialty || 'طب وجراحة الأسنان'}
              </p>
            </div>
          </div>
        </div>

        {/* Warning Alert Banner for Critical Medical Notes */}
        {(criticalAllergies.length > 0 || activeConditions.length > 0) && (
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-amber-300 font-bold shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
              تنبيهات صحية وطبية:
            </span>

            {criticalAllergies.map((a) => (
              <span
                key={a.id}
                className="bg-rose-500/30 text-rose-200 border border-rose-500/50 px-2 py-0.5 rounded-md font-medium"
              >
                حساسية شديدة: {a.allergen} ({ALLERGY_SEVERITY_AR[a.severity]})
              </span>
            ))}

            {activeConditions.slice(0, 3).map((m) => (
              <span
                key={m.id}
                className="bg-amber-500/20 text-amber-200 border border-amber-500/40 px-2 py-0.5 rounded-md font-medium"
              >
                {MEDICAL_CONDITION_KEY_AR[m.condition_key] || m.condition_key}
              </span>
            ))}

            {activeConditions.length > 3 && (
              <span className="text-slate-300">+{activeConditions.length - 3} حالات أخرى</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
