import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import {
  Modal,
  ModalContent,
} from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Odontogram } from '@/components/dental/Odontogram';
import { formatCurrency, formatDateAr } from '@/lib/formatters';
import {
  HeartPulse,
  Phone,
  Shield,
  Calendar,
  AlertTriangle,
  Stethoscope,
  Receipt,
  FileText,
  Edit2,
  CalendarPlus,
  Activity,
  AlertCircle,
  User,
} from 'lucide-react';
import type { Patient } from '@shared/contracts';
import {
  BLOOD_TYPE_AR,
  MEDICAL_CONDITION_KEY_AR,
  ALLERGY_SEVERITY_AR,
} from '@shared/contracts';

export interface PatientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string | null;
  onEditPatient?: (patient: Patient) => void;
  onBookAppointment?: (patient: Patient) => void;
}

export const PatientDetailsDialog: React.FC<PatientDetailsDialogProps> = ({
  open,
  onOpenChange,
  patientId,
  onEditPatient,
  onBookAppointment,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'medical' | 'odontogram' | 'treatments' | 'invoices'>('overview');

  // Fetch Patient Details
  const { data: patient } = useQuery({
    queryKey: queryKeys.patients.detail(patientId || ''),
    queryFn: async () => {
      if (!patientId) return null;
      const res = await api.patients.getById(patientId);
      return res.ok ? res.data : null;
    },
    enabled: !!patientId && open,
  });

  // Fetch Tooth Records
  const { data: toothRecords = [] } = useQuery({
    queryKey: queryKeys.toothRecords.byPatient(patientId || ''),
    queryFn: async () => {
      if (!patientId) return [];
      const res = await api.toothRecords.getByPatient(patientId);
      return res.ok ? res.data : [];
    },
    enabled: !!patientId && open,
  });

  // Fetch Treatments
  const { data: treatmentsData = [] } = useQuery({
    queryKey: queryKeys.treatments.list({ patient_id: patientId || '' }),
    queryFn: async () => {
      if (!patientId) return [];
      const res = await api.treatments.list({ patient_id: patientId, page: 1, limit: 100, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
    enabled: !!patientId && open,
  });

  // Fetch Invoices
  const { data: invoicesData = [] } = useQuery({
    queryKey: queryKeys.invoices.list({ patient_id: patientId || '' }),
    queryFn: async () => {
      if (!patientId) return [];
      const res = await api.invoices.list({ patient_id: patientId, page: 1, limit: 100, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
    enabled: !!patientId && open,
  });

  // Fetch Medical History
  const { data: medicalHistory = [] } = useQuery({
    queryKey: queryKeys.patients.medicalHistory(patientId || ''),
    queryFn: async () => {
      if (!patientId) return [];
      const res = await api.patients.getMedicalHistory(patientId);
      return res.ok ? res.data : [];
    },
    enabled: !!patientId && open,
  });

  // Fetch Allergies
  const { data: allergies = [] } = useQuery({
    queryKey: queryKeys.patients.allergies(patientId || ''),
    queryFn: async () => {
      if (!patientId) return [];
      const res = await api.patients.getAllergies(patientId);
      return res.ok ? res.data : [];
    },
    enabled: !!patientId && open,
  });

  // Fetch Appointments
  const { data: appointmentsData = [] } = useQuery({
    queryKey: queryKeys.appointments.list({ patient_id: patientId || '' }),
    queryFn: async () => {
      if (!patientId) return [];
      const res = await api.appointments.list({ patient_id: patientId, page: 1, limit: 100, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
    enabled: !!patientId && open,
  });

  if (!open) return null;

  const totalBalance = invoicesData.reduce((acc, inv) => acc + (inv.balance_halalas || 0), 0);
  const totalInvoiced = invoicesData.reduce((acc, inv) => acc + (inv.total_halalas || 0), 0);
  const totalPaid = invoicesData.reduce((acc, inv) => acc + (inv.paid_halalas || 0), 0);

  const activeMedicalConditions = medicalHistory.filter((m) => m.has_condition);
  const hasMedicalAlerts = activeMedicalConditions.length > 0 || allergies.length > 0;

  // Calculate age
  let patientAge: number | null = null;
  if (patient?.birth_date) {
    const b = new Date(patient.birth_date);
    if (!isNaN(b.getTime())) {
      const today = new Date();
      patientAge = today.getFullYear() - b.getFullYear();
      const m = today.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < b.getDate())) {
        patientAge--;
      }
    }
  }

  const fullName = patient ? `${patient.first_name} ${patient.father_name || ''} ${patient.family_name}`.trim() : '';

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-surface-card border border-surface-border shadow-2xl">
        {/* Top Header Profile Card */}
        <div className="p-6 border-b border-surface-border bg-gradient-to-r from-surface-card via-surface-hover/50 to-surface-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar
                src={patient?.photo_path || undefined}
                fallback={patient?.first_name?.charAt(0) || 'م'}
                size="xl"
                className="border-2 border-brand-blue/30 shadow-md ring-2 ring-brand-blue/10"
              />

              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-bold text-text-primary">{fullName}</h2>
                  <Badge variant="neutral" className="font-mono text-brand-blue border-brand-blue/30 bg-brand-blue/5">
                    {patient?.code}
                  </Badge>
                  <Badge variant={patient?.is_active ? 'ok' : 'neutral'}>
                    {patient?.is_active ? 'ملف نشط' : 'ملف مؤرشف'}
                  </Badge>
                  {hasMedicalAlerts && (
                    <Badge variant="danger" className="animate-pulse flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      تنبيه طبي
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-text-secondary flex-wrap">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-text-muted" />
                    <span dir="ltr">{patient?.phone}</span>
                  </span>
                  {patientAge !== null && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-text-muted" />
                      {patientAge} سنة ({patient?.gender === 'male' ? 'ذكر' : 'أنثى'})
                    </span>
                  )}
                  {patient?.blood_type && patient.blood_type !== 'unknown' && (
                    <span className="flex items-center gap-1">
                      <HeartPulse className="w-3.5 h-3.5 text-status-danger-fg" />
                      فصيلة {BLOOD_TYPE_AR[patient.blood_type]}
                    </span>
                  )}
                  {patient?.national_id && (
                    <span className="text-text-muted">هوية: {patient.national_id}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 self-end md:self-center">
              {onBookAppointment && patient && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<CalendarPlus className="w-4 h-4 text-brand-blue" />}
                  onClick={() => onBookAppointment(patient)}
                >
                  حجز موعد
                </Button>
              )}
              {onEditPatient && patient && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Edit2 className="w-4 h-4" />}
                  onClick={() => onEditPatient(patient)}
                >
                  تعديل الملف
                </Button>
              )}
            </div>
          </div>

          {/* Financial Glance Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-surface-border/60 text-xs">
            <div className="p-2.5 rounded-lg bg-surface-hover/80 border border-surface-border">
              <span className="text-text-secondary block mb-1">الرصيد المتبقي المستحق</span>
              <span className={`font-bold text-sm ${totalBalance > 0 ? 'text-status-danger-fg' : 'text-status-success-fg'}`}>
                {formatCurrency(totalBalance)}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-hover/80 border border-surface-border">
              <span className="text-text-secondary block mb-1">إجمالي الفواتير</span>
              <span className="font-bold text-sm text-text-primary">{formatCurrency(totalInvoiced)}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-hover/80 border border-surface-border">
              <span className="text-text-secondary block mb-1">إجمالي المدفوع</span>
              <span className="font-bold text-sm text-status-success-fg">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-hover/80 border border-surface-border">
              <span className="text-text-secondary block mb-1">إجمالي المواعيد</span>
              <span className="font-bold text-sm text-text-primary">{appointmentsData.length} زيارات</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-surface-border bg-surface-card overflow-x-auto select-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <User className="w-4 h-4" />
            نظرة عامة والبيانات
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('medical')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'medical'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            التاريخ الطبي والحساسيات
            {hasMedicalAlerts && (
              <span className="w-2 h-2 rounded-full bg-status-danger-fg" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('odontogram')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'odontogram'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Activity className="w-4 h-4" />
            المخطط السني (Odontogram)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('treatments')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'treatments'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            العلاجات والجلسات ({treatmentsData.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Receipt className="w-4 h-4" />
            الفواتير والمدفوعات ({invoicesData.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact & Address */}
                <div className="p-4 rounded-xl border border-surface-border bg-surface-card space-y-3">
                  <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
                    <Phone className="w-4 h-4 text-brand-blue" />
                    بيانات الاتصال والعنوان
                  </h3>
                  <div className="space-y-2 text-xs divide-y divide-surface-border/50">
                    <div className="flex justify-between py-1.5">
                      <span className="text-text-secondary">الجوال الأساسي:</span>
                      <span className="font-semibold font-mono text-text-primary" dir="ltr">{patient?.phone || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-text-secondary">الجوال البديل:</span>
                      <span className="font-mono text-text-primary" dir="ltr">{patient?.phone_alt || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-text-secondary">البريد الإلكتروني:</span>
                      <span className="text-text-primary">{patient?.email || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-text-secondary">المدينة:</span>
                      <span className="text-text-primary">{patient?.city || 'الرياض'}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-text-secondary">العنوان السكني:</span>
                      <span className="text-text-primary">{patient?.address || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-text-secondary">المهنة:</span>
                      <span className="text-text-primary">{patient?.occupation || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Emergency & Insurance */}
                <div className="space-y-6">
                  {/* Emergency Contact */}
                  <div className="p-4 rounded-xl border border-surface-border bg-surface-card space-y-3">
                    <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-status-warning-fg" />
                      جهة الاتصال في حالات الطوارئ
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">الاسم:</span>
                        <span className="font-semibold text-text-primary">{patient?.emergency_contact_name || 'غير محدد'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">رقم الهاتف:</span>
                        <span className="font-mono text-text-primary" dir="ltr">{patient?.emergency_contact_phone || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Insurance Info */}
                  <div className="p-4 rounded-xl border border-surface-border bg-surface-card space-y-3">
                    <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
                      <Shield className="w-4 h-4 text-brand-blue" />
                      معلومات التأمين الطبي
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">النوع:</span>
                        <span className="font-semibold text-text-primary">
                          {patient?.insurance_company_id ? 'مغطى بتأمين طبي' : 'دفع ذاتي (كاش)'}
                        </span>
                      </div>
                      {patient?.insurance_policy_no && (
                        <div className="flex justify-between">
                          <span className="text-text-secondary">رقم البوليصة:</span>
                          <span className="font-mono text-text-primary">{patient.insurance_policy_no}</span>
                        </div>
                      )}
                      {patient?.insurance_expiry && (
                        <div className="flex justify-between">
                          <span className="text-text-secondary">تاريخ الانتهاء:</span>
                          <span className="text-text-primary">{patient.insurance_expiry}</span>
                        </div>
                      )}
                      {patient?.referral_source && (
                        <div className="flex justify-between pt-2 border-t border-surface-border/50">
                          <span className="text-text-secondary">مصدر الإحالة:</span>
                          <span className="text-text-primary">{patient.referral_source}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* General Notes */}
              {patient?.notes && (
                <div className="p-4 rounded-xl border border-surface-border bg-surface-hover/30 space-y-2">
                  <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-blue" />
                    الملاحظات العامة والملخص السريري
                  </h3>
                  <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">
                    {patient.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEDICAL HISTORY & ALLERGIES */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              {/* Medical Alerts Banner if present */}
              {hasMedicalAlerts && (
                <div className="p-4 rounded-xl bg-status-danger-bg/40 border border-status-danger-fg/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-status-danger-fg shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-status-danger-fg">
                      تنبيه سريري هام للممارس الصحي
                    </h4>
                    <p className="text-xs text-status-danger-fg/80 mt-1">
                      يرجى الانتباه إلى السجل المرضي والحساسيات الدوائية الموضحة أدناه قبل وصف أي مضادات أو الشروع في إجراءات جراحية أو تخدير موضعي.
                    </p>
                  </div>
                </div>
              )}

              {/* Allergies Card */}
              <div className="p-4 rounded-xl border border-surface-border bg-surface-card space-y-3">
                <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-status-warning-fg" />
                  الحساسيات الدوائية (Drug Allergies)
                </h3>
                {allergies.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {allergies.map((allergy) => (
                      <div
                        key={allergy.id}
                        className="p-3 rounded-lg border border-status-danger-fg/30 bg-status-danger-bg/20 flex items-center justify-between"
                      >
                        <span className="text-xs font-bold text-status-danger-fg">{allergy.allergen}</span>
                        <Badge variant="danger">
                          {ALLERGY_SEVERITY_AR[allergy.severity] || allergy.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted py-2">لا توجد حساسيات دوائية مسجلة لهذا المريض.</p>
                )}
              </div>

              {/* Chronic Conditions */}
              <div className="p-4 rounded-xl border border-surface-border bg-surface-card space-y-3">
                <h3 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-status-danger-fg" />
                  الأمراض المزمنة والحالات السريرية
                </h3>
                {activeMedicalConditions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeMedicalConditions.map((cond) => (
                      <div
                        key={cond.id}
                        className="p-3 rounded-lg border border-surface-border bg-surface-hover/50 flex flex-col gap-1"
                      >
                        <span className="text-xs font-bold text-text-primary">
                          {MEDICAL_CONDITION_KEY_AR[cond.condition_key] || cond.condition_key}
                        </span>
                        {cond.details && (
                          <span className="text-[11px] text-text-secondary">{cond.details}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted py-2">لا توجد حالات مرضية مزمنة مسجلة.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ODONTOGRAM */}
          {activeTab === 'odontogram' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-surface-border bg-surface-card">
                <Odontogram records={toothRecords} readOnly />
              </div>
            </div>
          )}

          {/* TAB 4: TREATMENTS */}
          {activeTab === 'treatments' && (
            <div className="space-y-4">
              {treatmentsData.length > 0 ? (
                <div className="border border-surface-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-surface-hover/70 border-b border-surface-border font-bold text-text-secondary">
                      <tr>
                        <th className="p-3">الإجراء السني</th>
                        <th className="p-3">السن / السطح</th>
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">التكلفة</th>
                        <th className="p-3">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {treatmentsData.map((t) => (
                        <tr key={t.id} className="hover:bg-surface-hover/40">
                          <td className="p-3 font-semibold text-text-primary">{t.clinical_notes || 'إجراء علاجي'}</td>
                          <td className="p-3 font-mono text-text-secondary">
                            {t.tooth_number ? `سن #${t.tooth_number}` : 'عام'}
                          </td>
                          <td className="p-3 text-text-secondary">{formatDateAr(t.performed_at)}</td>
                          <td className="p-3 font-bold text-text-primary">{formatCurrency(t.price_halalas)}</td>
                          <td className="p-3">
                            <Badge variant={t.status === 'completed' ? 'ok' : 'warn'}>
                              {t.status === 'completed' ? 'مكتمل' : 'قيد التنفيذ'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-text-muted">
                  لا توجد علاجات أو جلسات مسجلة لهذا المريض حتى الآن.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: INVOICES */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              {invoicesData.length > 0 ? (
                <div className="border border-surface-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-surface-hover/70 border-b border-surface-border font-bold text-text-secondary">
                      <tr>
                        <th className="p-3">رقم الفاتورة</th>
                        <th className="p-3">تاريخ الإصدار</th>
                        <th className="p-3">الإجمالي</th>
                        <th className="p-3">المدفوع</th>
                        <th className="p-3">المتبقي</th>
                        <th className="p-3">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {invoicesData.map((inv) => (
                        <tr key={inv.id} className="hover:bg-surface-hover/40">
                          <td className="p-3 font-bold font-mono text-brand-blue">{inv.number}</td>
                          <td className="p-3 text-text-secondary">{inv.issue_date}</td>
                          <td className="p-3 font-bold text-text-primary">{formatCurrency(inv.total_halalas)}</td>
                          <td className="p-3 font-semibold text-status-success-fg">{formatCurrency(inv.paid_halalas)}</td>
                          <td className={`p-3 font-semibold ${inv.balance_halalas > 0 ? 'text-status-danger-fg' : 'text-text-muted'}`}>
                            {formatCurrency(inv.balance_halalas)}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                inv.status === 'paid'
                                  ? 'ok'
                                  : inv.status === 'partial'
                                  ? 'warn'
                                  : 'danger'
                              }
                            >
                              {inv.status === 'paid' ? 'مدفوعة بالكامل' : inv.status === 'partial' ? 'مدفوعة جزئياً' : 'غير مسددة'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-text-muted">
                  لا توجد فواتير مالية صادرة لهذا المريض بعد.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-surface-border bg-surface-hover/40 flex items-center justify-between">
          <div className="text-xs text-text-muted">
            تاريخ فتح الملف: {patient?.created_at ? formatDateAr(patient.created_at) : '—'}
          </div>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
};

export default PatientDetailsDialog;
