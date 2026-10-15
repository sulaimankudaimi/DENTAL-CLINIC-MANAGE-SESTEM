import React, { useState } from 'react';
import type { PaymentMethod, CreatePayment, InvoiceItem, Payment } from '@shared/contracts';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDateAr } from '@/lib/formatters';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { Printer, CreditCard, QrCode, DollarSign } from 'lucide-react';

export interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string | null;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  isOpen,
  onClose,
  invoiceId,
}) => {
  const queryClient = useQueryClient();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('card');
  const [payRef, setPayRef] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

  // Fetch invoice details
  const { data: invoice } = useQuery({
    queryKey: queryKeys.invoices.detail(invoiceId || ''),
    queryFn: async () => {
      if (!invoiceId) return null;
      const res = await api.invoices.getById(invoiceId);
      return res.ok ? res.data : null;
    },
    enabled: !!invoiceId && isOpen,
  });

  const items = invoice?.items || [];
  const payments = invoice?.payments || [];

  // Record payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (payload: CreatePayment) => {
      return api.payments.create(payload);
    },
    onSuccess: () => {
      if (invoiceId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(invoiceId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.payments.byInvoice(invoiceId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todaySummary });
      }
      setShowPaymentForm(false);
      setPayAmount('');
      setPayRef('');
      setPayError(null);
    },
    onError: (err: Error) => {
      setPayError(err.message || 'فشل تسجيل الدفعة');
    },
  });

  if (!invoice) return null;

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payAmount);
    if (!amountNum || amountNum <= 0) {
      setPayError('يرجى إدخال مبلغ صحيح');
      return;
    }
    const amountHalalas = Math.round(amountNum * 100);
    if (amountHalalas > invoice.balance_halalas) {
      setPayError(`المبلغ المدخل يتجاوز الرصيد المتبقي (${formatCurrency(invoice.balance_halalas)})`);
      return;
    }

    paymentMutation.mutate({
      clinic_id: invoice.clinic_id,
      invoice_id: invoice.id,
      patient_id: invoice.patient_id,
      amount_halalas: amountHalalas,
      method: payMethod,
      reference: payRef.trim() || null,
      paid_at: new Date().toISOString(),
      received_by: '00000000-0000-0000-0000-000000000001',
      notes: null,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`فاتورة ضريبية مبسطة: ${invoice.number}`}
      description="تفاصيل الفاتورة والمدفوعات وبيانات هيئة الزكاة والضريبة والجمارك"
      size="lg"
    >
      <div className="flex flex-col gap-5 print:p-0">
        {/* Actions bar */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                invoice.status === 'paid'
                  ? 'ok'
                  : invoice.status === 'partial'
                  ? 'warn'
                  : 'danger'
              }
            >
              {invoice.status === 'paid' ? 'مسددة بالكامل' : invoice.status === 'partial' ? 'مسددة جزئياً' : 'غير مسددة'}
            </Badge>
            <span className="text-xs text-slate-500 font-mono">تاريخ: {invoice.issue_date}</span>
          </div>

          <div className="flex items-center gap-2">
            {invoice.balance_halalas > 0 && !showPaymentForm && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setPayAmount(String(invoice.balance_halalas / 100));
                  setShowPaymentForm(true);
                }}
              >
                <DollarSign className="w-3.5 h-3.5 me-1 inline" />
                تسجيل دفعة
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="w-3.5 h-3.5 me-1 inline" />
              طباعة
            </Button>
          </div>
        </div>

        {/* Payment form dropdown if active */}
        {showPaymentForm && (
          <form
            onSubmit={handleRecordPayment}
            className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                تسجيل دفعة جديدة على الفاتورة
              </span>
              <button
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                إلغاء
              </button>
            </div>

            {payError && <div className="text-xs text-rose-600 font-bold">{payError}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="المبلغ (ر.س) *"
                type="number"
                step="0.5"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
              <Select
                label="طريقة الدفع *"
                value={payMethod}
                onValueChange={(val) => setPayMethod(val as PaymentMethod)}
                options={[
                  { label: 'بطاقة مدى / ائتمانية (Card)', value: 'card' },
                  { label: 'نقداً (Cash)', value: 'cash' },
                  { label: 'تحويل بنكي (Bank Transfer)', value: 'bank_transfer' },
                  { label: 'تأمين طبي (Insurance)', value: 'insurance' },
                ]}
              />
              <Input
                label="رقم المرجع / الإيصال"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="رقم مرجع الجهاز أو الحوالة"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={paymentMutation.isPending}
              >
                {paymentMutation.isPending ? 'جاري التأكيد...' : 'تأكيد وحفظ الدفعة'}
              </Button>
            </div>
          </form>
        )}

        {/* Invoice items table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-3">البند / الإجراء الطبي</th>
                <th className="p-3 text-center">السن</th>
                <th className="p-3 text-center">الكمية</th>
                <th className="p-3 text-center">السعر</th>
                <th className="p-3 text-center">الخصم</th>
                <th className="p-3 text-left pl-4">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item: InvoiceItem) => (
                <tr key={item.id}>
                  <td className="p-3 font-semibold text-slate-800">{item.description}</td>
                  <td className="p-3 text-center font-mono">{item.tooth_number ? `#${item.tooth_number}` : '—'}</td>
                  <td className="p-3 text-center">{item.quantity}</td>
                  <td className="p-3 text-center">{formatCurrency(item.unit_price_halalas)}</td>
                  <td className="p-3 text-center">{item.discount_halalas > 0 ? formatCurrency(item.discount_halalas) : '—'}</td>
                  <td className="p-3 text-left pl-4 font-bold text-slate-900">{formatCurrency(item.total_halalas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & ZATCA QR Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
          {/* ZATCA QR Code Display */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
            <div className="w-20 h-20 bg-slate-900 rounded flex items-center justify-center text-white shrink-0">
              <QrCode className="w-16 h-16 text-white" />
            </div>
            <div className="flex flex-col gap-1 text-[11px] text-slate-600">
              <span className="font-bold text-slate-900">فاتورة إلكترونية معتمدة</span>
              <span>الرقم الضريبي للمنشأة: 300012345600003</span>
              <span className="text-emerald-700 font-semibold">متوافقة مع متطلبات ZATCA مرحلة 2</span>
            </div>
          </div>

          {/* Financial Totals */}
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>المجموع الفرعي:</span>
              <span>{formatCurrency(invoice.subtotal_halalas)}</span>
            </div>
            {invoice.discount_halalas > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>إجمالي الخصم:</span>
                <span>-{formatCurrency(invoice.discount_halalas)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>ضريبة القيمة المضافة (15%):</span>
              <span>{formatCurrency(invoice.vat_halalas)}</span>
            </div>
            <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-sm text-slate-900">
              <span>المبلغ الإجمالي المستحق:</span>
              <span>{formatCurrency(invoice.total_halalas)}</span>
            </div>
            <div className="flex justify-between font-semibold text-emerald-700">
              <span>المبلغ المدفوع:</span>
              <span>{formatCurrency(invoice.paid_halalas)}</span>
            </div>
            <div className="flex justify-between font-bold text-rose-700 border-t border-dashed border-slate-200 pt-1">
              <span>المتبقي:</span>
              <span>{formatCurrency(invoice.balance_halalas)}</span>
            </div>
          </div>
        </div>

        {/* Payments History */}
        {payments.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2">سجل سندات القبض والمدفوعات ({payments.length})</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2">التاريخ</th>
                    <th className="p-2">رقم المرجع / السند</th>
                    <th className="p-2">طريقة الدفع</th>
                    <th className="p-2 text-left pl-3">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p: Payment) => (
                    <tr key={p.id}>
                      <td className="p-2 text-slate-600">{formatDateAr(p.paid_at)}</td>
                      <td className="p-2 font-mono font-semibold text-brand-navy">{p.reference || p.id.slice(0, 8)}</td>
                      <td className="p-2">
                        {p.method === 'cash'
                          ? 'نقداً'
                          : p.method === 'card'
                          ? 'بطاقة مدى'
                          : p.method === 'transfer'
                          ? 'تحويل بنكي'
                          : 'تأمين'}
                      </td>
                      <td className="p-2 text-left pl-3 font-bold text-emerald-700">{formatCurrency(p.amount_halalas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceDetailsModal;
