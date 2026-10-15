import React from 'react';
import type { Patient, Invoice, Appointment, InsuranceCompany } from '@shared/contracts';
import { formatCurrency, formatDateAr } from '@/lib/formatters';
import {
  FileText,
  Calendar,
  Wallet,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export interface PatientStatusCardsProps {
  patient: Patient;
  invoices: Invoice[];
  appointments: Appointment[];
  insuranceCompany?: InsuranceCompany | null;
}

export const PatientStatusCards: React.FC<PatientStatusCardsProps> = ({
  patient,
  invoices,
  appointments,
  insuranceCompany,
}) => {
  // Financial calculations
  const totalBalanceHalalas = invoices.reduce((sum, inv) => sum + (inv.balance_halalas || 0), 0);
  const totalBilledHalalas = invoices.reduce((sum, inv) => sum + (inv.total_halalas || 0), 0);
  const totalPaidHalalas = invoices.reduce((sum, inv) => sum + (inv.paid_halalas || 0), 0);

  // Appointments calculations
  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
  );

  const now = new Date().toISOString();
  const pastAppointments = sortedAppointments.filter((a) => a.start_at < now);
  const futureAppointments = sortedAppointments.filter((a) => a.start_at >= now && a.status !== 'cancelled');

  const lastVisit = pastAppointments.length > 0 ? pastAppointments[0] : null;
  const nextAppointment = futureAppointments.length > 0 ? futureAppointments[futureAppointments.length - 1] : null;

  return (
    <div id="patient-status-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. File Number & Registration */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">رقم الملف والتسجيل</span>
          <div className="p-2 rounded-lg bg-blue-50 text-brand-navy">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-mono text-lg font-bold text-slate-900 tracking-wider">
            {patient.code}
          </p>
          <p className="text-xs text-slate-500">
            تاريخ التسجيل: {patient.created_at ? formatDateAr(patient.created_at) : '—'}
          </p>
          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-teal-700 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            ملف رقمي موثق بالنظام
          </div>
        </div>
      </div>

      {/* 2. Last Visit & Next Appointment */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">سجل الزيارات والمواعيد</span>
          <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs">
            <span className="text-slate-500 block">آخر زيارة:</span>
            <span className="font-bold text-slate-800">
              {lastVisit ? formatDateAr(lastVisit.start_at) : 'لم يسجل زيارات سابقة'}
            </span>
          </div>
          <div className="pt-1 text-xs border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-500">القادم:</span>
            <span className="font-semibold text-teal-700">
              {nextAppointment ? formatDateAr(nextAppointment.start_at) : 'لا يوجد موعد'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Account Balance */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">الرصيد المالي المستحق</span>
          <div
            className={`p-2 rounded-lg ${
              totalBalanceHalalas > 0
                ? 'bg-rose-50 text-rose-700'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <p
            className={`text-lg font-bold ${
              totalBalanceHalalas > 0 ? 'text-rose-600' : 'text-emerald-700'
            }`}
          >
            {formatCurrency(totalBalanceHalalas)}
          </p>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>المسدد: {formatCurrency(totalPaidHalalas)}</span>
            <span>الإجمالي: {formatCurrency(totalBilledHalalas)}</span>
          </div>
          {totalBalanceHalalas > 0 && (
            <div className="pt-1 flex items-center gap-1 text-[11px] text-rose-600 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              توجد مبالغ مؤجلة السداد
            </div>
          )}
        </div>
      </div>

      {/* 4. Insurance Coverage */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">التغطية التأمينية</span>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-900 truncate">
            {insuranceCompany ? insuranceCompany.name : 'علاج نقدي (بدون تأمين)'}
          </p>
          {patient.insurance_policy_no ? (
            <p className="text-xs text-slate-500 font-mono">
              رقم البوليصة: {patient.insurance_policy_no}
            </p>
          ) : (
            <p className="text-xs text-slate-400">لا توجد بوليصة مسجلة</p>
          )}
          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-indigo-700 font-medium">
            <span>
              {insuranceCompany
                ? `نسبة التغطية: ${insuranceCompany.coverage_percent_default}%`
                : 'تسعيرة الدفع النقدي'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
