import React from 'react';
import type { Invoice, InvoiceItem, Payment, Patient, Installment } from '@shared/contracts';
import { formatCurrency, formatDateAr } from '@/lib/formatters';
import {
  X,
  Printer,
  CreditCard,
  CalendarClock,
  MessageCircle,
  Ban,
  QrCode,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface InvoiceDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  items: InvoiceItem[];
  payments: Payment[];
  installments?: Installment[];
  patient?: Patient | null;
  onPay: () => void;
  onInstallments: () => void;
  onPrint: () => void;
  onWhatsApp: () => void;
  onVoid: () => void;
}

export const InvoiceDetailsDrawer: React.FC<InvoiceDetailsDrawerProps> = ({
  isOpen,
  onClose,
  invoice,
  items,
  payments,
  installments = [],
  patient,
  onPay,
  onInstallments,
  onPrint,
  onWhatsApp,
  onVoid,
}) => {
  if (!isOpen || !invoice) return null;

  const patientName = patient ? `${patient.first_name} ${patient.family_name}` : 'مريض غير مسجل';
  const isVoid = invoice.status === 'void';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col justify-between">
          {/* Drawer Top Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E4E9C] flex items-center justify-center font-bold">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight">تفاصيل الفاتورة</h3>
                  <span className="font-mono text-xs font-bold text-[#1E4E9C] bg-blue-50 px-2 py-0.5 rounded-md">
                    {invoice.number}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{patientName}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* Status & Timing Banner */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">حالة السداد:</span>
                  {invoice.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" /> مسددة بالكامل
                    </span>
                  ) : invoice.status === 'partial' ? (
                    <span className="inline-flex items-center gap-1 font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md">
                      <Clock className="w-3.5 h-3.5" /> مسددة جزئياً
                    </span>
                  ) : invoice.status === 'void' ? (
                    <span className="inline-flex items-center gap-1 font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md line-through">
                      <Ban className="w-3.5 h-3.5" /> ملغاة
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                      <AlertCircle className="w-3.5 h-3.5" /> بانتظار السداد
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  تاريخ الإصدار: {formatDateAr(invoice.issue_date)}
                </div>
              </div>

              <div className="text-left">
                <span className="text-slate-500 text-[11px]">المتبقي:</span>
                <div className="text-base font-black font-mono text-rose-600">
                  {formatCurrency(invoice.balance_halalas)}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-800 text-xs">بنود وإجراءات الفاتورة ({items.length})</h4>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">البند</th>
                      <th className="p-2.5 text-center">السن</th>
                      <th className="p-2.5 text-center">الكمية</th>
                      <th className="p-2.5 text-center">السعر</th>
                      <th className="p-2.5 text-left pl-3">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-slate-400">لا توجد بنود مفصلة</td>
                      </tr>
                    ) : (
                      items.map((it) => (
                        <tr key={it.id}>
                          <td className="p-2.5 font-semibold text-slate-800">{it.description}</td>
                          <td className="p-2.5 text-center font-mono">{it.tooth_number ? `#${it.tooth_number}` : '—'}</td>
                          <td className="p-2.5 text-center font-mono">{it.quantity}</td>
                          <td className="p-2.5 text-center font-mono">{formatCurrency(it.unit_price_halalas)}</td>
                          <td className="p-2.5 text-left pl-3 font-bold font-mono text-slate-900">
                            {formatCurrency(it.total_halalas)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tax & Total Calculation */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>المجموع الفرعي (قبل الضريبة):</span>
                <span className="font-mono">{formatCurrency(invoice.subtotal_halalas)}</span>
              </div>
              {invoice.discount_halalas > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>الخصم:</span>
                  <span className="font-mono">-{formatCurrency(invoice.discount_halalas)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>ضريبة القيمة المضافة (15%):</span>
                <span className="font-mono">{formatCurrency(invoice.vat_halalas)}</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between font-black text-sm text-slate-900">
                <span>المبلغ الإجمالي المستحق:</span>
                <span className="font-mono">{formatCurrency(invoice.total_halalas)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>المسدد:</span>
                <span className="font-mono">{formatCurrency(invoice.paid_halalas)}</span>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-1 flex justify-between font-bold text-rose-600">
                <span>الرصيد المتبقي:</span>
                <span className="font-mono">{formatCurrency(invoice.balance_halalas)}</span>
              </div>
            </div>

            {/* ZATCA QR Box */}
            <div className="flex items-center gap-3 p-3 bg-slate-900 text-white rounded-2xl">
              <div className="w-16 h-16 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center">
                <QrCode className="w-full h-full text-slate-900" />
              </div>
              <div className="flex flex-col gap-0.5 text-[11px]">
                <span className="font-bold text-white">فاتورة ضريبية إلكترونية معتمدة</span>
                <span className="text-slate-300">الرقم الضريبي للمنشأة: 300012345600003</span>
                <span className="text-emerald-400 font-semibold text-[10px]">
                  متوافقة مع اشتراطات هيئة الزكاة والضريبة والجمارك (ZATCA)
                </span>
              </div>
            </div>

            {/* Payments History */}
            {payments.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-800 text-xs mb-2">سندات القبض المسجلة ({payments.length})</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2">التاريخ</th>
                        <th className="p-2">المرجع</th>
                        <th className="p-2">الطريقة</th>
                        <th className="p-2 text-left pl-3">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className="p-2 text-slate-600">{formatDateAr(p.paid_at)}</td>
                          <td className="p-2 font-mono font-semibold text-[#1E4E9C]">{p.reference || p.id.slice(0, 8)}</td>
                          <td className="p-2 text-slate-600">
                            {p.method === 'cash' ? 'نقداً' : p.method === 'transfer' ? 'تحويل' : 'بطاقة مدى'}
                          </td>
                          <td className="p-2 text-left pl-3 font-bold font-mono text-emerald-700">
                            {formatCurrency(p.amount_halalas)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Installments Plan List */}
            {installments.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-800 text-xs mb-2">جدول الأقساط المعتمدة ({installments.length})</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2">الدفعة</th>
                        <th className="p-2">تاريخ الاستحقاق</th>
                        <th className="p-2 text-center">الحالة</th>
                        <th className="p-2 text-left pl-3">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {installments.map((inst, idx) => (
                        <tr key={inst.id}>
                          <td className="p-2 font-bold text-slate-700">قسط #{idx + 1}</td>
                          <td className="p-2 text-slate-600 font-mono">{inst.due_date}</td>
                          <td className="p-2 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                              مجدول
                            </span>
                          </td>
                          <td className="p-2 text-left pl-3 font-bold font-mono text-[#1E4E9C]">
                            {formatCurrency(inst.amount_halalas)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notes if any */}
            {invoice.notes && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1">الملاحظات:</span>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrint}
                className="flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                طباعة الفاتورة
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onWhatsApp}
                className="flex items-center gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              >
                <MessageCircle className="w-4 h-4" />
                واتساب
              </Button>

              {!isVoid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onVoid}
                  className="flex items-center gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Ban className="w-4 h-4" />
                  إلغاء
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isVoid && invoice.balance_halalas > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onInstallments}
                    className="flex items-center gap-1.5 text-sky-600 border-sky-200 hover:bg-sky-50"
                  >
                    <CalendarClock className="w-4 h-4" />
                    خطة تقسيط
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onPay}
                    className="bg-[#1E4E9C] hover:bg-[#1E4E9C]/90 text-white flex items-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    تسجيل دفعة
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
