import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { TrendingUp, FileText, RotateCcw, ShieldCheck } from 'lucide-react';

export interface BillingKpiCardsProps {
  monthlyRevenueHalalas: number;
  pendingInvoicesCount: number;
  refundedHalalas: number;
  insuranceStatusText?: string;
  insuranceApprovedPercent?: number;
}

export const BillingKpiCards: React.FC<BillingKpiCardsProps> = ({
  monthlyRevenueHalalas,
  pendingInvoicesCount,
  refundedHalalas,
  insuranceStatusText = 'حالة التأمين',
  insuranceApprovedPercent = 94,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. إجمالي الإيرادات الشهرية - Tone Green */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-between hover:shadow-md transition-shadow">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-slate-500">إجمالي الإيرادات الشهرية</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {formatCurrency(monthlyRevenueHalalas)}
            </span>
          </div>
          <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            تحديث فوري مباشر
          </span>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
          <TrendingUp className="w-6 h-6 stroke-[2.2]" />
        </div>
      </div>

      {/* 2. الفواتير المعلقة - Tone Rose */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-between hover:shadow-md transition-shadow">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-slate-500">الفواتير المعلقة</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black text-rose-600 tracking-tight">
              {pendingInvoicesCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">فاتورة</span>
          </div>
          <span className="text-[11px] font-medium text-rose-600/80">
            تتطلب متابعة التحصيل
          </span>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100/80 flex items-center justify-center text-rose-500 shadow-sm shrink-0">
          <FileText className="w-6 h-6 stroke-[2.2]" />
        </div>
      </div>

      {/* 3. المبالغ المستردة - Tone Blue */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-between hover:shadow-md transition-shadow">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-slate-500">المبالغ المستردة</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {refundedHalalas === 0 ? '0.00 ر.س' : formatCurrency(refundedHalalas)}
            </span>
          </div>
          <span className="text-[11px] font-medium text-sky-600">
            معدل الاسترجاع 0.0%
          </span>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100/80 flex items-center justify-center text-sky-600 shadow-sm shrink-0">
          <RotateCcw className="w-6 h-6 stroke-[2.2]" />
        </div>
      </div>

      {/* 4. حالة التأمين - Tone Green */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-between hover:shadow-md transition-shadow">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-slate-500">حالة التأمين</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black text-emerald-700 tracking-tight">
              {insuranceStatusText}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600">
            نسبة قبول المطالبات {insuranceApprovedPercent}%
          </span>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
          <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
        </div>
      </div>
    </div>
  );
};
