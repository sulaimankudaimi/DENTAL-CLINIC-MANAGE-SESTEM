import React from 'react';
import type { InsuranceClaim } from '@shared/contracts';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Coins,
} from 'lucide-react';

interface Props {
  claims: InsuranceClaim[];
}

export const InsuranceStatsCards: React.FC<Props> = ({ claims }) => {
  // 1. Submitted (مقدّمة)
  const submittedClaims = claims.filter((c) => c.status === 'submitted' || c.status === 'pre_approved');
  const submittedTotalHalalas = submittedClaims.reduce((acc, c) => acc + (c.claimed_halalas || 0), 0);

  // 2. Approved (معتمدة وموافقة جزئية)
  const approvedClaims = claims.filter((c) => c.status === 'approved' || c.status === 'partially_approved');
  const approvedTotalHalalas = approvedClaims.reduce((acc, c) => acc + (c.approved_halalas || 0), 0);

  // 3. Rejected (مرفوضة)
  const rejectedClaims = claims.filter((c) => c.status === 'rejected');
  const rejectedTotalHalalas = rejectedClaims.reduce((acc, c) => acc + (c.rejected_halalas || c.claimed_halalas || 0), 0);

  // 4. Collected (مبالغ محصّلة من التأمين)
  const paidClaims = claims.filter((c) => c.status === 'paid');
  const paidTotalHalalas = paidClaims.reduce((acc, c) => acc + (c.approved_halalas || c.claimed_halalas || 0), 0);

  const formatSAR = (halalas: number) => {
    return (halalas / 100).toLocaleString('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* 1. Submitted */}
      <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-white p-5 shadow-xs transition hover:shadow-md dark:border-blue-900/50 dark:from-blue-950/20 dark:to-zinc-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
            المطالبات المقدّمة
          </span>
          <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
            <FileText className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {submittedClaims.length}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">مطالبة معلقة</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-blue-100/80 pt-2 text-xs text-zinc-600 dark:border-blue-900/40 dark:text-zinc-400">
          <span>إجمالي المطالب به:</span>
          <span className="font-bold text-blue-700 dark:text-blue-300 font-mono">
            {formatSAR(submittedTotalHalalas)} ر.س
          </span>
        </div>
      </div>

      {/* 2. Approved */}
      <div className="relative overflow-hidden rounded-xl border border-green-200 bg-gradient-to-br from-green-50/70 to-white p-5 shadow-xs transition hover:shadow-md dark:border-green-900/50 dark:from-green-950/20 dark:to-zinc-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-green-800 dark:text-green-300">
            المطالبات المعتمدة
          </span>
          <div className="rounded-lg bg-green-100 p-2 text-green-700 dark:bg-green-900/60 dark:text-green-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {approvedClaims.length}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">مطالبة موافق عليها</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-green-100/80 pt-2 text-xs text-zinc-600 dark:border-green-900/40 dark:text-zinc-400">
          <span>المبلغ المعتمد:</span>
          <span className="font-bold text-green-700 dark:text-green-300 font-mono">
            {formatSAR(approvedTotalHalalas)} ر.س
          </span>
        </div>
      </div>

      {/* 3. Rejected */}
      <div className="relative overflow-hidden rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50/70 to-white p-5 shadow-xs transition hover:shadow-md dark:border-rose-900/50 dark:from-rose-950/20 dark:to-zinc-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
            المطالبات المرفوضة
          </span>
          <div className="rounded-lg bg-rose-100 p-2 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {rejectedClaims.length}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">مرفوضة / استقطاع</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-rose-100/80 pt-2 text-xs text-zinc-600 dark:border-rose-900/40 dark:text-zinc-400">
          <span>المبالغ المرفوضة:</span>
          <span className="font-bold text-rose-700 dark:text-rose-300 font-mono">
            {formatSAR(rejectedTotalHalalas)} ر.س
          </span>
        </div>
      </div>

      {/* 4. Collected / Paid */}
      <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-5 shadow-xs transition hover:shadow-md dark:border-emerald-900/50 dark:from-emerald-950/20 dark:to-zinc-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            المبالغ المحصّلة
          </span>
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
            <Coins className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
            {formatSAR(paidTotalHalalas)}
          </span>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">ر.س</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-emerald-100/80 pt-2 text-xs text-zinc-600 dark:border-emerald-900/40 dark:text-zinc-400">
          <span>مطالبات تم تسويتها:</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-300">
            {paidClaims.length} مطالبة مدفوعة
          </span>
        </div>
      </div>
    </div>
  );
};
