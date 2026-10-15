import React, { useState } from 'react';
import type { Invoice, Payment } from '@shared/contracts';
import { formatCurrency, formatDateAr } from '@/lib/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { INVOICE_STATUS_AR, PAYMENT_METHOD_AR } from '@shared/contracts';
import {
  Receipt,
  Plus,
  CreditCard,
  Eye,
  CheckCircle,
} from 'lucide-react';

export interface PatientBillingTabProps {
  invoices: Invoice[];
  payments?: Payment[];
  onCreateInvoice: () => void;
  onViewInvoice: (invoiceId: string) => void;
}

export const PatientBillingTab: React.FC<PatientBillingTabProps> = ({
  invoices,
  payments = [],
  onCreateInvoice,
  onViewInvoice,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'payments'>('invoices');

  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total_halalas || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paid_halalas || 0), 0);
  const totalBalance = invoices.reduce((sum, inv) => sum + (inv.balance_halalas || 0), 0);
  const totalVat = invoices.reduce((sum, inv) => sum + (inv.vat_halalas || 0), 0);

  return (
    <div id="patient-billing-tab" className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block mb-1">إجمالي الفواتير</span>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalBilled)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            عدد الفواتير: {invoices.length}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block mb-1">إجمالي المسدد</span>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
          <span className="text-[11px] text-emerald-700/80 mt-1 block flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            سندات قبض مقيدة
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block mb-1">الرصيد المتبقي المستحق</span>
          <p
            className={`text-xl font-bold ${
              totalBalance > 0 ? 'text-rose-600' : 'text-slate-800'
            }`}
          >
            {formatCurrency(totalBalance)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {totalBalance > 0 ? 'يوجد رصيد مطلوب تحصيله' : 'الحساب خالص بالكامل'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block mb-1">ضريبة القيمة المضافة (15%)</span>
          <p className="text-xl font-bold text-slate-800">{formatCurrency(totalVat)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">متوافقة مع هيئة الزكاة ZATCA</span>
        </div>
      </div>

      {/* Sub-tabs & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('invoices')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeSubTab === 'invoices'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الفواتير الضريبية ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('payments')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeSubTab === 'payments'
                ? 'bg-brand-navy text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            سندات الدفع والقبض ({payments.length})
          </button>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onCreateInvoice}
          icon={<Plus className="w-4 h-4" />}
          className="text-xs"
        >
          إصدار فاتورة جديدة
        </Button>
      </div>

      {/* Content depending on sub-tab */}
      {activeSubTab === 'invoices' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {invoices.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">لا توجد فواتير مصدرة للمريض</p>
              <p className="text-xs text-slate-500">
                يمكنك الضغط على زر "إصدار فاتورة جديدة" لإضافة بنود العلاجات وإصدار الفاتورة
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">تاريخ الإصدار</th>
                    <th className="p-3 text-center">المبلغ قبل الضريبة</th>
                    <th className="p-3 text-center">الضريبة (15%)</th>
                    <th className="p-3 text-center">الإجمالي</th>
                    <th className="p-3 text-center">المسدد</th>
                    <th className="p-3 text-center">المتبقي</th>
                    <th className="p-3 text-center">الحالة</th>
                    <th className="p-3 text-left pl-4">معاينة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-brand-navy">{inv.number}</td>
                      <td className="p-3 text-slate-600">{formatDateAr(inv.issue_date)}</td>
                      <td className="p-3 text-center">{formatCurrency(inv.subtotal_halalas)}</td>
                      <td className="p-3 text-center text-slate-500">{formatCurrency(inv.vat_halalas)}</td>
                      <td className="p-3 text-center font-bold text-slate-900">
                        {formatCurrency(inv.total_halalas)}
                      </td>
                      <td className="p-3 text-center text-emerald-700 font-semibold">
                        {formatCurrency(inv.paid_halalas)}
                      </td>
                      <td
                        className={`p-3 text-center font-bold ${
                          inv.balance_halalas > 0 ? 'text-rose-600' : 'text-slate-700'
                        }`}
                      >
                        {formatCurrency(inv.balance_halalas)}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={
                            inv.status === 'paid'
                              ? 'success'
                              : inv.status === 'partial'
                              ? 'warning'
                              : inv.status === 'unpaid'
                              ? 'danger'
                              : 'outline'
                          }
                          className="text-[10px]"
                        >
                          {INVOICE_STATUS_AR[inv.status] || inv.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-left pl-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewInvoice(inv.id)}
                          icon={<Eye className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          تفاصيل
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {payments.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">لا توجد سندات دفع مسجلة</p>
              <p className="text-xs text-slate-500">
                تسجيل المدفوعات يتم من خلال فتح الفاتورة المعنية والضغط على "تسجيل دفعة"
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">تاريخ الدفع</th>
                    <th className="p-3">رقم المرجع / الإيصال</th>
                    <th className="p-3">طريقة الدفع</th>
                    <th className="p-3 text-left pl-4">المبلغ المسدد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-600">{formatDateAr(p.paid_at)}</td>
                      <td className="p-3 font-mono text-brand-navy font-semibold">
                        {p.reference || p.id.slice(0, 8)}
                      </td>
                      <td className="p-3">
                        <Badge variant="info" className="text-[10px]">
                          {PAYMENT_METHOD_AR[p.method] || p.method}
                        </Badge>
                      </td>
                      <td className="p-3 text-left pl-4 font-bold text-emerald-700">
                        {formatCurrency(p.amount_halalas)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
