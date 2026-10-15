import React, { useState, useEffect } from 'react';
import type { Invoice, PaymentMethod, CreatePayment } from '@shared/contracts';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/formatters';
import { CreditCard, Banknote, Landmark, ShieldCheck, Sparkles, Printer } from 'lucide-react';

export interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  patientName?: string;
  onSuccess: (paymentData: CreatePayment, shouldPrintReceipt?: boolean) => void;
  isSubmitting?: boolean;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  onClose,
  invoice,
  patientName,
  onSuccess,
  isSubmitting = false,
}) => {
  const [amountRiyals, setAmountRiyals] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [reference, setReference] = useState('');
  const [paidAt, setPaidAt] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize form when invoice opens
  useEffect(() => {
    if (invoice && isOpen) {
      // Default to full remaining balance in Riyals
      const remainingRiyals = (invoice.balance_halalas / 100).toFixed(2);
      setAmountRiyals(remainingRiyals);
      setMethod('card');
      setReference('');
      setPaidAt(new Date().toISOString().slice(0, 16));
      setNotes('');
      setError(null);
    }
  }, [invoice, isOpen]);

  if (!invoice) return null;

  const handleQuickFullPayment = () => {
    setAmountRiyals((invoice.balance_halalas / 100).toFixed(2));
    setError(null);
  };

  const handleQuickHalfPayment = () => {
    const halfHalalas = Math.floor(invoice.balance_halalas / 2);
    setAmountRiyals((halfHalalas / 100).toFixed(2));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent, printReceipt = false) => {
    e.preventDefault();
    const num = parseFloat(amountRiyals);
    if (isNaN(num) || num <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    // Convert to strict Halalas (Integer)
    const halalas = Math.round(num * 100);

    if (halalas > invoice.balance_halalas) {
      setError(`المبلغ المدخل يتجاوز الرصيد المتبقي بالفاتورة (${formatCurrency(invoice.balance_halalas)})`);
      return;
    }

    const payload: CreatePayment = {
      clinic_id: invoice.clinic_id,
      invoice_id: invoice.id,
      patient_id: invoice.patient_id,
      amount_halalas: halalas,
      method,
      reference: reference.trim() || null,
      paid_at: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
      received_by: '00000000-0000-0000-0000-000000000001',
      notes: notes.trim() || null,
    };

    onSuccess(payload, printReceipt);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تسجيل دفعة جديدة وسند قبض"
      size="md"
    >
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4 text-xs">
        {/* Invoice Summary Banner */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-500 font-medium">الفاتورة رقم: {invoice.number}</span>
            <span className="text-xs font-bold text-slate-800">{patientName || 'المريض'}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500">الرصيد المتبقي:</span>
            <span className="text-sm font-bold text-rose-600 font-mono">
              {formatCurrency(invoice.balance_halalas)}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Quick Amount Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">اقتراحات الدفع السريع:</span>
          <button
            type="button"
            onClick={handleQuickFullPayment}
            className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1E4E9C] border border-blue-200 hover:bg-blue-100 font-bold transition-colors"
          >
            كامل المتبقي ({formatCurrency(invoice.balance_halalas)})
          </button>
          <button
            type="button"
            onClick={handleQuickHalfPayment}
            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 font-medium transition-colors"
          >
            نصف المتبقي (50%)
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            المبلغ المراد تحصيله (ر.س) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amountRiyals}
              onChange={(e) => {
                setAmountRiyals(e.target.value);
                setError(null);
              }}
              className="w-full pl-12 pr-3 py-2 text-sm font-bold text-slate-800 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E4E9C]/20 focus:border-[#1E4E9C]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
              ر.س
            </span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-slate-700 font-bold mb-1.5">
            طريقة الدفع <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'card', label: 'بطاقة مدى / ائتمان', icon: CreditCard },
              { id: 'cash', label: 'نقداً (Cash)', icon: Banknote },
              { id: 'transfer', label: 'تحويل بنكي', icon: Landmark },
              { id: 'insurance', label: 'تغطية تأمين', icon: ShieldCheck },
              { id: 'mada', label: 'شبكة مدى POS', icon: CreditCard },
              { id: 'other', label: 'Apple Pay / أخرى', icon: Sparkles },
            ].map((pm) => {
              const Icon = pm.icon;
              const isSelected = method === pm.id;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setMethod(pm.id as PaymentMethod)}
                  className={`flex items-center gap-1.5 p-2 rounded-xl border transition-all text-right ${
                    isSelected
                      ? 'border-[#1E4E9C] bg-blue-50/70 text-[#1E4E9C] font-bold shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#1E4E9C]' : 'text-slate-400'}`} />
                  <span className="truncate">{pm.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reference & Transaction Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">رقم المرجع / إيصال الشبكة</label>
            <Input
              type="text"
              placeholder="مثال: POS-AUTH-98214"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">تاريخ ووقت التحصيل</label>
            <Input
              type="datetime-local"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">ملاحظات إضافية</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أية ملاحظات خاصة بسند القبض..."
            className="w-full p-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E4E9C]/20 focus:border-[#1E4E9C]"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, true)}
              className="flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              حفظ وطباعة سند القبض
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="bg-[#1E4E9C] hover:bg-[#1E4E9C]/90 text-white"
            >
              {isSubmitting ? 'جاري التسجيل...' : 'تأكيد وحفظ الدفعة'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
