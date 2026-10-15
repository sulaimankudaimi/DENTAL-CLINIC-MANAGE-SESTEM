import React from 'react';
import type { Payment, Invoice, Patient, Clinic } from '@shared/contracts';
import { tafqeetRiyals } from '@/features/billing/lib/tafqeet';

interface Props {
  payment: Payment;
  invoice?: Invoice | null;
  patient: Patient;
  clinic?: Clinic | null;
}

export const ReceiptPrintTemplate: React.FC<Props> = ({
  payment,
  invoice,
  patient,
  clinic,
}) => {
  const clinicName = clinic?.name || 'مجمع عيادات أفق لطب الأسنان';
  const clinicVat = clinic?.tax_number || '310123456700003';
  const clinicCr = clinic?.cr_number || '1010892341';
  const clinicPhone = clinic?.phone || '011-4567890';
  const clinicAddress = clinic?.address || 'الرياض، المملكة العربية السعودية';

  const amountSar = (payment.amount_halalas / 100).toFixed(2);
  const amountWords = tafqeetRiyals(payment.amount_halalas);

  const paymentDate = new Date(payment.paid_at).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const paymentTime = new Date(payment.paid_at).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const getMethodName = (method: string) => {
    switch (method) {
      case 'cash':
        return 'نقداً (Cash)';
      case 'mada':
        return 'بطاقة مدى (Mada)';
      case 'credit_card':
        return 'بطاقة ائتمانية (Credit Card)';
      case 'bank_transfer':
        return 'تحويل بنكي (Bank Transfer)';
      case 'insurance':
        return 'تأمين طبي (Insurance)';
      default:
        return method;
    }
  };

  const patientFullName = `${patient.first_name} ${patient.father_name || ''} ${patient.family_name}`.trim();

  return (
    <div className="w-full bg-white text-zinc-900 p-8 font-sans print:p-0 print:m-0 print:w-full print:bg-white text-xs leading-relaxed" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-5 mb-6">
        <div>
          <h1 className="text-lg font-black text-zinc-950">{clinicName}</h1>
          <p className="text-[11px] text-zinc-600 font-medium">مركز متخصص لجراحة وتجميل وطب الأسنان</p>
          <div className="pt-2 text-[10px] text-zinc-600 space-y-0.5">
            <div>{clinicAddress} | هاتف: <span dir="ltr">{clinicPhone}</span></div>
            <div>
              الرقم الضريبي: <span className="font-mono font-bold text-zinc-800">{clinicVat}</span> | السجل التجاري: <span className="font-mono">{clinicCr}</span>
            </div>
          </div>
        </div>

        <div className="text-left flex flex-col items-end">
          <div className="border border-zinc-900 rounded-md px-4 py-1.5 bg-zinc-50 text-center mb-2">
            <h2 className="text-sm font-black text-zinc-950">سند قبض مالي</h2>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">
              Official Payment Receipt
            </span>
          </div>
          <div className="text-[11px] text-zinc-600 space-y-0.5">
            <div>
              رقم السند: <span className="font-mono font-bold text-zinc-900">REC-{(payment.id || '').slice(0, 8).toUpperCase()}</span>
            </div>
            <div>التاريخ: <span className="font-mono">{paymentDate}</span></div>
            <div>الوقت: <span className="font-mono">{paymentTime}</span></div>
          </div>
        </div>
      </div>

      {/* Amount Highlight Banner */}
      <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-4 mb-6 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-emerald-900 block">المبلغ المستلم رقماً:</span>
          <span className="text-2xl font-black font-mono text-emerald-800">{amountSar} ر.س</span>
        </div>
        <div className="text-left">
          <span className="text-[11px] font-bold text-emerald-900 block">المبلغ كتابة:</span>
          <span className="text-xs font-bold text-emerald-950">{amountWords}</span>
        </div>
      </div>

      {/* Receipt Details Box */}
      <div className="rounded-xl border border-zinc-300 p-5 mb-6 space-y-3.5 text-xs bg-zinc-50/40">
        <div className="grid grid-cols-3 gap-4 border-b border-zinc-200 pb-3">
          <div>
            <span className="text-zinc-500 block text-[11px]">استلمنا من السيد / السيدة:</span>
            <span className="font-bold text-sm text-zinc-900">{patientFullName}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">رقم الملف الطبي:</span>
            <span className="font-mono font-bold text-zinc-800">{patient.code}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">رقم الهوية / الإقامة:</span>
            <span className="font-mono text-zinc-800">{patient.national_id || '—'}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-b border-zinc-200 pb-3">
          <div>
            <span className="text-zinc-500 block text-[11px]">طريقة السداد:</span>
            <span className="font-bold text-zinc-900">{getMethodName(payment.method)}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">الرقم المرجعي / التفويض:</span>
            <span className="font-mono font-bold text-zinc-800">{payment.reference || '—'}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">الفاتورة المرتبطة:</span>
            <span className="font-mono font-bold text-primary">{invoice?.number || '—'}</span>
          </div>
        </div>

        <div>
          <span className="text-zinc-500 block text-[11px]">وذلك لقاء:</span>
          <span className="font-medium text-zinc-800">
            {payment.notes || `دفعة سداد حساب خدمات طبية ورعاية أسنان بموجب الفاتورة رقم ${invoice?.number || ''}`}
          </span>
        </div>
      </div>

      {/* Invoice Balance Summary if available */}
      {invoice && (
        <div className="rounded-lg border border-zinc-200 p-3 bg-zinc-50 mb-8 text-[11px] grid grid-cols-3 text-center">
          <div>
            <span className="text-zinc-500 block">إجمالي الفاتورة:</span>
            <span className="font-mono font-bold text-zinc-900">{(invoice.total_halalas / 100).toFixed(2)} ر.س</span>
          </div>
          <div>
            <span className="text-zinc-500 block">إجمالي المسدد حتى الآن:</span>
            <span className="font-mono font-bold text-emerald-700">{(invoice.paid_halalas / 100).toFixed(2)} ر.س</span>
          </div>
          <div>
            <span className="text-zinc-500 block">المتبقي بذمة المريض:</span>
            <span className="font-mono font-bold text-rose-700">{(invoice.balance_halalas / 100).toFixed(2)} ر.س</span>
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs">
        <div className="border-t border-dashed border-zinc-400 pt-3">
          <span className="block font-bold mb-1">المستلم / أمين الصندوق</span>
          <span className="text-zinc-400 text-[10px]">التوقيع: ................................</span>
        </div>
        <div className="border-t border-dashed border-zinc-400 pt-3">
          <span className="block font-bold mb-1">ختم المركز والاعتماد المالي</span>
          <span className="text-zinc-400 text-[10px]">الختم الرسمي للمركز</span>
        </div>
      </div>
    </div>
  );
};
