import React, { useState, useEffect } from 'react';
import type { InsuranceClaim, InsuranceClaimStatus } from '@shared/contracts';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  AlertTriangle,
  Coins,
  ShieldCheck,
  X,
  FileCheck,
  Info,
} from 'lucide-react';
import { CLAIM_STATUS_MAP } from '../types';

interface Props {
  claim: InsuranceClaim | null;
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  invoiceNumber?: string;
}

export const ClaimStatusTransitionModal: React.FC<Props> = ({
  claim,
  isOpen,
  onClose,
  patientName,
}) => {
  const queryClient = useQueryClient();

  const [targetStatus, setTargetStatus] = useState<InsuranceClaimStatus>('approved');
  const [approvedSar, setApprovedSar] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (claim) {
      const defaultClaimedSar = (claim.claimed_halalas / 100).toFixed(2);

      // Determine smart target status depending on current status
      if (claim.status === 'draft') {
        setTargetStatus('submitted');
      } else if (claim.status === 'submitted') {
        setTargetStatus('approved');
      } else if (claim.status === 'pre_approved') {
        setTargetStatus('approved');
      } else if (claim.status === 'approved' || claim.status === 'partially_approved') {
        setTargetStatus('paid');
      } else {
        setTargetStatus('submitted');
      }

      setApprovedSar(defaultClaimedSar);
      setRejectionReason(claim.rejection_reason || '');
      setErrorMsg('');
    }
  }, [claim, isOpen]);

  if (!isOpen || !claim) return null;

  const claimedSar = claim.claimed_halalas / 100;
  const currentApprovedVal = parseFloat(approvedSar) || 0;
  const rejectedSar = Math.max(0, claimedSar - currentApprovedVal);

  const allowedTransitions: InsuranceClaimStatus[] = (() => {
    switch (claim.status) {
      case 'draft':
        return ['submitted'];
      case 'submitted':
        return ['pre_approved', 'approved', 'partially_approved', 'rejected'];
      case 'pre_approved':
        return ['approved', 'partially_approved', 'rejected'];
      case 'approved':
      case 'partially_approved':
        return ['paid'];
      case 'rejected':
        return ['submitted', 'draft'];
      case 'paid':
        return [];
      default:
        return ['submitted', 'approved', 'rejected'];
    }
  })();

  const transitionMutation = useMutation({
    mutationFn: async () => {
      if ((targetStatus === 'rejected' || targetStatus === 'partially_approved') && !rejectionReason.trim()) {
        throw new Error('يرجى تحديد سبب الرفض أو الاستقطاع');
      }

      const approvedHalalas =
        targetStatus === 'rejected'
          ? 0
          : targetStatus === 'approved' && !approvedSar
          ? claim.claimed_halalas
          : Math.round((parseFloat(approvedSar) || 0) * 100);

      const rejectedHalalas = Math.max(0, claim.claimed_halalas - approvedHalalas);

      const res = await api.insurance.transitionClaimStatus(claim.id, targetStatus, {
        approved_halalas: approvedHalalas,
        rejected_halalas: rejectedHalalas,
        rejection_reason: rejectionReason.trim() || undefined,
        userId: 'u1000000-0000-0000-0000-000000000001',
      });

      if (res && !res.ok) {
        throw new Error(res.error || 'فشل تحديث حالة المطالبة');
      }
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.insurance.claims() });
      queryClient.invalidateQueries({ queryKey: queryKeys.insurance.claim(claim.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.insurance.auditLogs() });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      onClose();
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || 'حدث خطأ أثناء الانتقال');
    },
  });

  const handleSelectStatus = (status: InsuranceClaimStatus) => {
    setTargetStatus(status);
    if (status === 'approved') {
      setApprovedSar((claim.claimed_halalas / 100).toFixed(2));
    } else if (status === 'partially_approved') {
      const partial = Math.round(claim.claimed_halalas * 0.8) / 100;
      setApprovedSar(partial.toFixed(2));
      if (!rejectionReason) setRejectionReason('استقطاع نسبة تحمل 20% وبنود مستثناة');
    } else if (status === 'rejected') {
      setApprovedSar('0');
      if (!rejectionReason) setRejectionReason('رفضت شركة التأمين التغطية لعدم شمول الإجراء الطبي');
    }
  };

  const currentStatusInfo = CLAIM_STATUS_MAP[claim.status];
  const targetStatusInfo = CLAIM_STATUS_MAP[targetStatus];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                تحديث مسار ودورة حياة المطالبة
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                المطالبة رقم: <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{claim.claim_number}</span>
                {patientName ? ` — ${patientName}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Status vs New Status Banner */}
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
            <div>
              <span className="text-[11px] text-zinc-500 block">الحالة الحالية:</span>
              <span className="inline-flex items-center gap-1 font-bold text-sm text-zinc-800 dark:text-zinc-200 mt-0.5">
                {currentStatusInfo?.label}
              </span>
            </div>

            <div className="flex items-center gap-2 text-zinc-400">
              <ArrowLeft className="h-5 w-5 rtl:rotate-0 rotate-180" />
            </div>

            <div>
              <span className="text-[11px] text-zinc-500 block">الحالة المستهدفة:</span>
              <span className="inline-flex items-center gap-1 font-bold text-sm text-primary mt-0.5">
                {targetStatusInfo?.label}
              </span>
            </div>
          </div>

          {/* Select next state */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
              اختر المرحلة التالية في دورة حياة المطالبة:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allowedTransitions.map((statusKey) => {
                const info = CLAIM_STATUS_MAP[statusKey];
                const isSelected = targetStatus === statusKey;
                return (
                  <button
                    key={statusKey}
                    type="button"
                    onClick={() => handleSelectStatus(statusKey)}
                    className={`flex flex-col items-center justify-center rounded-xl p-3 text-xs font-bold border transition ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary shadow-xs dark:bg-primary/20'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    <span>{info?.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Financial calculations if Approved or Partially Approved */}
          {(targetStatus === 'approved' || targetStatus === 'partially_approved') && (
            <div className="rounded-xl border border-green-200 bg-green-50/60 p-4 dark:border-green-900/40 dark:bg-green-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-green-900 dark:text-green-200 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-green-600" />
                  المبلغ المعتمد للتسديد (ر.س)
                </span>
                <span className="text-xs text-zinc-500">
                  إجمالي المطالبة: {claimedSar.toFixed(2)} ر.س
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                    المبلغ المعتمد من التأمين:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={claimedSar}
                    value={approvedSar}
                    onChange={(e) => setApprovedSar(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-bold text-green-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-green-300"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                    المتبقي بذمة المريض (التحمل):
                  </label>
                  <div className="h-9 flex items-center px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-bold text-sm text-zinc-800 dark:text-zinc-200">
                    {rejectedSar.toFixed(2)} ر.س
                  </div>
                </div>
              </div>

              {/* Automatic Financial Integration Notice */}
              <div className="flex items-start gap-2 rounded-lg bg-emerald-100/70 p-3 text-xs text-emerald-950 dark:bg-emerald-900/30 dark:text-emerald-200">
                <Info className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>انعكاس مالي فوري:</strong> سيتم تسجيل دفعة مالية تلقائية بوسيلة دفع{' '}
                  <span className="underline font-bold">تأمين طبي (insurance)</span> على الفاتورة بقيمة{' '}
                  <span className="font-bold font-mono">{currentApprovedVal.toFixed(2)} ر.س</span>،
                  وسيتحول المتبقي{' '}
                  <span className="font-bold font-mono">{rejectedSar.toFixed(2)} ر.س</span>{' '}
                  تلقائياً إلى ذمة المريض مع تسجيل حركة تدقيق كاملة في <span className="font-mono">audit_log</span>.
                </p>
              </div>
            </div>
          )}

          {/* Rejection / Deductions Reason Input */}
          {(targetStatus === 'rejected' || targetStatus === 'partially_approved' || rejectedSar > 0) && (
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                سبب الرفض أو الاستقطاع <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="أدخل سبب الرفض أو الاستقطاع الوارد من شركة التأمين (مثال: عدم شمول الإجراء، تجاوز السقف السنوي، نسبة تحمل مريض)..."
                className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-xs text-zinc-900 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          )}

          {/* Paid status explanation */}
          {targetStatus === 'paid' && (
            <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-4 text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
              <div>
                <strong className="block text-sm font-bold mb-1">تسوية التحصيل المالي:</strong>
                يؤكد هذا الإجراء استلام العيادة للتحويل البنكي أو الشيك من شركة التأمين وإغلاق المطالبة بالكامل.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={transitionMutation.isPending}
            onClick={() => transitionMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {transitionMutation.isPending ? 'جاري الانتقال...' : 'تأكيد تغيير الحالة'}
          </button>
        </div>
      </div>
    </div>
  );
};
