import React, { useState } from 'react';
import type { Invoice } from '@shared/contracts';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/formatters';
import { AlertTriangle, Ban } from 'lucide-react';

export interface VoidInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  patientName?: string;
  onConfirmVoid: (invoiceId: string, reason: string) => void;
  isSubmitting?: boolean;
}

export const VoidInvoiceDialog: React.FC<VoidInvoiceDialogProps> = ({
  isOpen,
  onClose,
  invoice,
  patientName,
  onConfirmVoid,
  isSubmitting = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('يرجى كتابة سبب الإلغاء، فهو إلزامي وفقاً للضوابط المحاسبية.');
      return;
    }
    onConfirmVoid(invoice.id, reason.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إلغاء الفاتورة (Void Invoice)"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold">تحذير محاسبي</span>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              إلغاء الفاتورة إجراء لا يمكن التراجع عنه. سيتم تصنيف الفاتورة كملغاة وإلغاء المتبقي المستحق ({formatCurrency(invoice.balance_halalas)}).
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center text-slate-700">
          <span>الفاتورة: <strong className="font-mono text-slate-900">{invoice.number}</strong></span>
          <span>المريض: <strong className="text-slate-900">{patientName}</strong></span>
        </div>

        {error && (
          <div className="p-2 text-xs font-semibold text-rose-700 bg-rose-50 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-slate-700 font-bold mb-1">
            سبب الإلغاء <span className="text-rose-500">* (إلزامي)</span>
          </label>
          <textarea
            rows={3}
            required
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
            placeholder="اكتب سبب إلغاء الفاتورة بالتفصيل (مثل: خطأ في إدخال الإجراء الطبي، تغيير خطة العلاج، إلغاء الموعد...)"
            className="w-full p-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>

        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            تراجع
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={isSubmitting}
            className="flex items-center gap-1.5"
          >
            <Ban className="w-4 h-4" />
            {isSubmitting ? 'جاري الإلغاء...' : 'تأكيد إلغاء الفاتورة'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
