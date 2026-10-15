import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Patient, InsuranceCompany } from '@shared/contracts';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  MessageCircle,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type ExpiringPatient = Patient & { daysRemaining: number };

export const PolicyExpiryAlertBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const { data: expiringPatients = [] } = useQuery<ExpiringPatient[]>({
    queryKey: queryKeys.insurance.expiringPolicies(30),
    queryFn: async () => {
      const res = await api.insurance.getExpiringPolicies(30);
      return res && res.ok ? res.data : [];
    },
    staleTime: 60000,
  });

  const { data: companies = [] } = useQuery<InsuranceCompany[]>({
    queryKey: queryKeys.insurance.companies,
    queryFn: async () => {
      const res = await api.insurance.getCompanies();
      return res.ok ? res.data : [];
    },
  });

  if (isDismissed || expiringPatients.length === 0) {
    return null;
  }

  const expiredCount = expiringPatients.filter((p: ExpiringPatient) => p.daysRemaining <= 0).length;
  const expiringSoonCount = expiringPatients.filter((p: ExpiringPatient) => p.daysRemaining > 0).length;

  const getCompanyName = (companyId?: string | null) => {
    if (!companyId) return 'غير محدد';
    const comp = companies.find((c: InsuranceCompany) => c.id === companyId);
    return comp ? comp.name : 'شركة تأمين';
  };

  const handleWhatsAppReminder = (patient: ExpiringPatient) => {
    const daysText =
      patient.daysRemaining <= 0
        ? 'انتهت صلاحيتها'
        : `تنتهي صلاحيتها خلال ${patient.daysRemaining} يوماً (بتاريخ ${patient.insurance_expiry})`;
    const text = `مرحباً ${patient.first_name}، نود تذكيركم من عياداتنا بأن بوليصة التأمين الطبي الخاصة بكم (${patient.insurance_policy_no || ''} - ${getCompanyName(patient.insurance_company_id)}) ${daysText}. يرجى تزويدنا بالوثيقة المجددة لضمان استمرار تغطية علاجاتكم.`;
    const cleanPhone = patient.phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? `966${cleanPhone.slice(1)}` : cleanPhone;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/90 shadow-sm overflow-hidden transition-all dark:border-amber-900/60 dark:bg-amber-950/30">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-amber-950 dark:text-amber-100 text-sm sm:text-base">
                تنبيه بوالص التأمين المنتهية والقريبة من الانتهاء
              </h3>
              <span className="inline-flex items-center rounded-full bg-amber-200/80 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                {expiringPatients.length} مرضى
              </span>
            </div>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-0.5">
              {expiredCount > 0 && (
                <span className="font-medium text-rose-600 dark:text-rose-400 ml-2">
                  {expiredCount} بوليصة منتهية بالفعل
                </span>
              )}
              {expiringSoonCount > 0 && (
                <span>
                  {expiringSoonCount} بوليصة توشك على الانتهاء خلال الـ 30 يوماً القادمة.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/70"
          >
            {isExpanded ? (
              <>
                إخفاء القائمة
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                استعراض المرضى ({expiringPatients.length})
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            aria-label="إغلاق التنبيه مؤقتاً"
            className="rounded-lg p-1.5 text-amber-700 hover:bg-amber-200/60 transition dark:text-amber-300 dark:hover:bg-amber-900/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-amber-200/80 bg-white/70 px-4 py-3 sm:px-6 dark:border-amber-900/40 dark:bg-zinc-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-amber-200/60 text-amber-900 dark:border-amber-900/30 dark:text-amber-200">
                  <th className="py-2 px-3 font-semibold">المريض</th>
                  <th className="py-2 px-3 font-semibold">شركة التأمين</th>
                  <th className="py-2 px-3 font-semibold">رقم البوليصة</th>
                  <th className="py-2 px-3 font-semibold">تاريخ الانتهاء</th>
                  <th className="py-2 px-3 font-semibold">الحالة</th>
                  <th className="py-2 px-3 font-semibold text-center">إجراءات التواصل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/60 dark:divide-amber-900/20">
                {expiringPatients.map((patient: ExpiringPatient) => {
                  const isExpired = patient.daysRemaining <= 0;
                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-amber-50/50 transition dark:hover:bg-amber-950/20"
                    >
                      <td className="py-2.5 px-3 font-medium text-zinc-900 dark:text-zinc-100">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="hover:text-primary hover:underline flex items-center gap-1.5"
                        >
                          <span>
                            {patient.first_name} {patient.father_name || ''} {patient.family_name}
                          </span>
                          <span className="text-[10px] text-zinc-400">({patient.code})</span>
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300">
                        {getCompanyName(patient.insurance_company_id)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-600 dark:text-zinc-400">
                        {patient.insurance_policy_no || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-zinc-800 dark:text-zinc-200">
                        {patient.insurance_expiry}
                      </td>
                      <td className="py-2.5 px-3">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            <AlertTriangle className="h-3 w-3" />
                            منتهية ({Math.abs(patient.daysRemaining)} يوم)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            <Clock className="h-3 w-3" />
                            متبقي {patient.daysRemaining} يوم
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleWhatsAppReminder(patient)}
                            title="إرسال تذكير واتساب"
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-white text-[11px] font-medium shadow hover:bg-emerald-700 transition"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            واتساب
                          </button>
                          <Link
                            to={`/patients/${patient.id}`}
                            title="عرض ملف المريض وتحديث البوليصة"
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-zinc-700 text-[11px] hover:bg-zinc-50 transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                            الملف
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
