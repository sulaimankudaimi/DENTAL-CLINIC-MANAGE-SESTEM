import React, { useState, useEffect } from 'react';
import type { Invoice } from '@shared/contracts';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/formatters';
import { CalendarClock, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface InstallmentsPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  patientName?: string;
  onSave: (installments: Array<{ due_date: string; amount_halalas: number }>) => void;
  isSaving?: boolean;
}

interface InstallmentRow {
  dueDate: string;
  amountHalalas: number;
}

export const InstallmentsPlanDialog: React.FC<InstallmentsPlanDialogProps> = ({
  isOpen,
  onClose,
  invoice,
  patientName,
  onSave,
  isSaving = false,
}) => {
  const [count, setCount] = useState<number>(3);
  const [frequency, setFrequency] = useState<'monthly' | 'biweekly'>('monthly');
  const [rows, setRows] = useState<InstallmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Generate installments
  useEffect(() => {
    if (!invoice || !isOpen) return;

    const balance = invoice.balance_halalas;
    if (balance <= 0) return;

    const n = Math.max(2, count);
    const base = Math.floor(balance / n);
    const rem = balance % n;

    const generated: InstallmentRow[] = [];
    const now = new Date();

    for (let i = 0; i < n; i++) {
      const d = new Date(now);
      if (frequency === 'monthly') {
        d.setMonth(d.getMonth() + (i + 1));
      } else {
        d.setDate(d.getDate() + (i + 1) * 14);
      }
      const dueDateStr = d.toISOString().split('T')[0];
      // Remainder goes to the first installment to avoid rounding error
      const amt = i === 0 ? base + rem : base;
      generated.push({
        dueDate: dueDateStr,
        amountHalalas: amt,
      });
    }

    setRows(generated);
    setError(null);
  }, [invoice, isOpen, count, frequency]);

  if (!invoice) return null;

  const currentTotal = rows.reduce((sum, r) => sum + r.amountHalalas, 0);
  const diffHalalas = invoice.balance_halalas - currentTotal;

  const handleAmountChange = (idx: number, newRiyals: string) => {
    const num = parseFloat(newRiyals);
    const halalas = isNaN(num) ? 0 : Math.round(num * 100);
    const copy = [...rows];
    copy[idx].amountHalalas = halalas;
    setRows(copy);
  };

  const handleDateChange = (idx: number, newDate: string) => {
    const copy = [...rows];
    copy[idx].dueDate = newDate;
    setRows(copy);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (diffHalalas !== 0) {
      setError(`مجموع الأقساط يجب أن يساوي تماماً الرصيد المتبقي (${formatCurrency(invoice.balance_halalas)})`);
      return;
    }

    onSave(
      rows.map((r) => ({
        due_date: r.dueDate,
        amount_halalas: r.amountHalalas,
      }))
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إنشاء خطة تقسيط للمريض"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Banner */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-500 font-medium">رقم الفاتورة: {invoice.number}</span>
            <span className="text-xs font-bold text-slate-800">{patientName}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500">إجمالي المبلغ للتقسيط:</span>
            <span className="text-sm font-bold text-[#1E4E9C] font-mono">
              {formatCurrency(invoice.balance_halalas)}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Controls: Count & Frequency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <div>
            <label className="block text-slate-700 font-bold mb-1">عدد الدفعات / الأقساط</label>
            <div className="flex items-center gap-1.5">
              {[2, 3, 4, 6, 12].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCount(num)}
                  className={`flex-1 py-1.5 rounded-lg border font-bold text-xs transition-all ${
                    count === num
                      ? 'bg-[#1E4E9C] text-white border-[#1E4E9C]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {num} أقساط
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">دورية الاستحقاق</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFrequency('monthly')}
                className={`flex-1 py-1.5 rounded-lg border font-bold text-xs transition-all ${
                  frequency === 'monthly'
                    ? 'bg-[#1E4E9C] text-white border-[#1E4E9C]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                شهرياً
              </button>
              <button
                type="button"
                onClick={() => setFrequency('biweekly')}
                className={`flex-1 py-1.5 rounded-lg border font-bold text-xs transition-all ${
                  frequency === 'biweekly'
                    ? 'bg-[#1E4E9C] text-white border-[#1E4E9C]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                كل أسبوعين
              </button>
            </div>
          </div>
        </div>

        {/* Installments Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5">الدفعة</th>
                <th className="p-2.5">تاريخ الاستحقاق</th>
                <th className="p-2.5 text-left pl-3">المبلغ المستحق (ر.س)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="p-2.5 font-bold text-slate-700">
                    القسط رقم {idx + 1}
                  </td>
                  <td className="p-2.5">
                    <input
                      type="date"
                      value={row.dueDate}
                      onChange={(e) => handleDateChange(idx, e.target.value)}
                      className="p-1 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#1E4E9C]"
                    />
                  </td>
                  <td className="p-2.5 text-left pl-3">
                    <div className="inline-flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={(row.amountHalalas / 100).toFixed(2)}
                        onChange={(e) => handleAmountChange(idx, e.target.value)}
                        className="w-28 p-1 text-xs font-bold text-left font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#1E4E9C]"
                      />
                      <span className="text-slate-500">ر.س</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Validation Footer */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2">
            {diffHalalas === 0 ? (
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                المجموع متطابق تماماً مع رصيد الفاتورة
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-600 font-bold">
                <AlertCircle className="w-4 h-4" />
                يوجد فرق قدره: {formatCurrency(Math.abs(diffHalalas))}
              </span>
            )}
          </div>
          <div className="font-mono font-bold text-slate-800">
            المجموع: {formatCurrency(currentTotal)}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving || diffHalalas !== 0}
            className="bg-[#1E4E9C] hover:bg-[#1E4E9C]/90 text-white flex items-center gap-1.5"
          >
            <CalendarClock className="w-4 h-4" />
            {isSaving ? 'جاري الحفظ...' : 'اعتماد وجدولة خطة الأقساط'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
