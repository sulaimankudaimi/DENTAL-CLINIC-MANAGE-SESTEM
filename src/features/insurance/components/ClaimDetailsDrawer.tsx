import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { InsuranceClaim, Patient, Invoice, InsuranceCompany, AuditLog } from '@shared/contracts';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import {
  X,
  FileText,
  User,
  Clock,
  Printer,
  Edit3,
  ExternalLink,
  History,
  FileCheck,
} from 'lucide-react';
import { CLAIM_STATUS_MAP } from '../types';
import { Link } from 'react-router-dom';

interface Props {
  claim: InsuranceClaim | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenTransition: (claim: InsuranceClaim) => void;
  onOpenPrint: (claim: InsuranceClaim) => void;
}

export const ClaimDetailsDrawer: React.FC<Props> = ({
  claim,
  isOpen,
  onClose,
  onOpenTransition,
  onOpenPrint,
}) => {
  // Fetch patient
  const { data: patient } = useQuery<Patient | null>({
    queryKey: queryKeys.patients.detail(claim?.patient_id || ''),
    queryFn: async () => {
      if (!claim?.patient_id) return null;
      const res = await api.patients.getById(claim.patient_id);
      return res.ok ? res.data : null;
    },
    enabled: !!claim?.patient_id && isOpen,
  });

  // Fetch company
  const { data: companies = [] } = useQuery<InsuranceCompany[]>({
    queryKey: queryKeys.insurance.companies,
    queryFn: async () => {
      const res = await api.insurance.getCompanies();
      return res.ok ? res.data : [];
    },
    enabled: isOpen,
  });

  // Fetch invoice
  const { data: invoice } = useQuery<Invoice | null>({
    queryKey: queryKeys.invoices.detail(claim?.invoice_id || ''),
    queryFn: async () => {
      if (!claim?.invoice_id) return null;
      const res = await api.invoices.getById(claim.invoice_id);
      return res.ok ? res.data : null;
    },
    enabled: !!claim?.invoice_id && isOpen,
  });

  // Fetch audit logs for this claim
  const { data: auditLogs = [] } = useQuery<AuditLog[]>({
    queryKey: queryKeys.insurance.auditLogs('insurance_claim', claim?.id),
    queryFn: async () => {
      if (!claim?.id) return [];
      const res = await api.insurance.getAuditLogs('insurance_claim', claim.id);
      return res && res.ok ? res.data : [];
    },
    enabled: !!claim?.id && isOpen,
  });

  if (!isOpen || !claim) return null;

  const company = companies.find((c: InsuranceCompany) => c.id === claim.company_id);
  const statusInfo = CLAIM_STATUS_MAP[claim.status] || {
    label: claim.status,
    tone: 'neutral',
    description: '',
  };

  const formatSAR = (halalas?: number | null) => {
    if (halalas === null || halalas === undefined) return '0.00 ر.س';
    return `${(halalas / 100).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س`;
  };

  // Lifecycle steps
  const steps = [
    { key: 'draft', label: 'مسودة' },
    { key: 'submitted', label: 'مقدّمة' },
    { key: 'pre_approved', label: 'موافقة مسبقة' },
    { key: 'approved', label: claim.status === 'partially_approved' ? 'معتمدة جزئياً' : claim.status === 'rejected' ? 'مرفوضة' : 'معتمدة' },
    { key: 'paid', label: 'مدفوعة' },
  ];

  const getStepStatus = (stepKey: string) => {
    const order = ['draft', 'submitted', 'pre_approved', 'approved', 'paid'];
    const currentIdx = order.indexOf(claim.status === 'partially_approved' || claim.status === 'rejected' ? 'approved' : claim.status);
    const stepIdx = order.indexOf(stepKey);

    if (claim.status === 'rejected' && stepKey === 'approved') return 'rejected';
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'upcoming';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-xl h-full bg-white shadow-2xl dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  {claim.claim_number}
                </h2>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    statusInfo.tone === 'green' || statusInfo.tone === 'emerald'
                      ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300'
                      : statusInfo.tone === 'rose'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      : statusInfo.tone === 'amber'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : statusInfo.tone === 'purple'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                تاريخ التقديم: {new Date(claim.submitted_at).toLocaleDateString('ar-SA')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPrint(claim)}
              title="طباعة نموذج المطالبة"
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-right">
          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
            <div>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                تحديث مسار دورة الحياة:
              </span>
              <span className="text-[11px] text-zinc-500">
                انتقال الحالة ينعكس مالياً وفورياً على الفاتورة
              </span>
            </div>
            <button
              onClick={() => onOpenTransition(claim)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-primary/90 transition"
            >
              <Edit3 className="h-3.5 w-3.5" />
              تغيير الحالة
            </button>
          </div>

          {/* Lifecycle Progress Bar */}
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              مراحل دورة حياة المطالبة
            </h3>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-zinc-200 dark:bg-zinc-700 -translate-y-1/2 z-0" />
              {steps.map((st) => {
                const s = getStepStatus(st.key);
                return (
                  <div key={st.key} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        s === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : s === 'current'
                          ? 'bg-primary text-white ring-4 ring-primary/20'
                          : s === 'rejected'
                          ? 'bg-rose-600 text-white'
                          : 'bg-zinc-100 text-zinc-400 border border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700'
                      }`}
                    >
                      {s === 'completed' ? '✓' : s === 'rejected' ? '✕' : ''}
                    </div>
                    <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 mt-1.5">
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="rounded-xl border border-zinc-200 p-4 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/40">
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-3">
              البيانات المالية للمطالبة
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-white p-3 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">
                <span className="text-[10px] text-zinc-500 block">المبلغ المطالب به</span>
                <span className="font-bold text-sm text-blue-700 dark:text-blue-300 font-mono mt-0.5 block">
                  {formatSAR(claim.claimed_halalas)}
                </span>
              </div>

              <div className="rounded-lg bg-white p-3 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">
                <span className="text-[10px] text-zinc-500 block">المبلغ المعتمد</span>
                <span className="font-bold text-sm text-emerald-700 dark:text-emerald-300 font-mono mt-0.5 block">
                  {formatSAR(claim.approved_halalas)}
                </span>
              </div>

              <div className="rounded-lg bg-white p-3 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">
                <span className="text-[10px] text-zinc-500 block">المرفوض / التحمل</span>
                <span className="font-bold text-sm text-rose-700 dark:text-rose-300 font-mono mt-0.5 block">
                  {formatSAR(claim.rejected_halalas)}
                </span>
              </div>
            </div>

            {claim.rejection_reason && (
              <div className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                <strong className="block mb-0.5">سبب الرفض أو الاستقطاع:</strong>
                <span>{claim.rejection_reason}</span>
              </div>
            )}
          </div>

          {/* Patient & Policy Info */}
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 space-y-2.5 text-xs">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary" />
                بيانات المريض والبوليصة
              </span>
              {patient && (
                <Link
                  to={`/patients/${patient.id}`}
                  className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                >
                  عرض الملف
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </h3>

            <div className="grid grid-cols-2 gap-2 text-zinc-600 dark:text-zinc-400 pt-1">
              <div>
                <span className="text-zinc-400 block text-[10px]">المريض:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {patient ? `${patient.first_name} ${patient.father_name || ''} ${patient.family_name}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">رقم الملف / الهوية:</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                  {patient?.code || '—'} ({patient?.national_id || '—'})
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">شركة التأمين:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {company?.name || '—'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">رقم البوليصة:</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                  {patient?.insurance_policy_no || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Invoice Info */}
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 space-y-2.5 text-xs">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                الفاتورة المرتبطة
              </span>
              <Link
                to="/billing"
                className="text-primary hover:underline flex items-center gap-1 text-[11px]"
              >
                صفحة الفواتير
                <ExternalLink className="h-3 w-3" />
              </Link>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-zinc-600 dark:text-zinc-400 pt-1">
              <div>
                <span className="text-zinc-400 block text-[10px]">رقم الفاتورة:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  {invoice?.number || '—'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">إجمالي الفاتورة:</span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  {formatSAR(invoice?.total_halalas)}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">المسدد حتى الآن:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatSAR(invoice?.paid_halalas)}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">المتبقي بذمة المريض:</span>
                <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                  {formatSAR(invoice?.balance_halalas)}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Log / Verification Trace */}
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-primary" />
                سجل التدقيق والحركات (Audit Log)
              </h3>
              <span className="text-[10px] text-zinc-400">
                {auditLogs.length} حركة مسجلة
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">لا توجد حركات تدقيق مسجلة لهذه المطالبة</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {auditLogs.map((log: AuditLog) => (
                  <div
                    key={log.id}
                    className="rounded-lg bg-zinc-50 p-2.5 text-xs dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(log.created_at).toLocaleTimeString('ar-SA')} -{' '}
                        {new Date(log.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    {log.after && (
                      <div className="mt-1 text-[11px] text-zinc-500 font-mono">
                        {JSON.stringify(log.after)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800 flex items-center justify-between">
          <button
            onClick={() => onOpenPrint(claim)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Printer className="h-4 w-4" />
            طباعة نموذج المطالبة
          </button>

          <button
            onClick={() => onOpenTransition(claim)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow hover:bg-primary/90 transition"
          >
            <Edit3 className="h-4 w-4" />
            تحديث الحالة
          </button>
        </div>
      </div>
    </div>
  );
};
