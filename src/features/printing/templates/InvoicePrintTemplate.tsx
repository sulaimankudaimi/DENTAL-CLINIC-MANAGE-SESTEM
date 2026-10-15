import React, { useEffect, useState } from 'react';
import type { Invoice, InvoiceItem, Patient, Clinic } from '@shared/contracts';
import { generateZatcaQrDataUrl, type ZatcaQrFields } from '@/lib/zatcaQr';
import { QrCode, ShieldCheck } from 'lucide-react';

interface Props {
  invoice: Invoice;
  items: InvoiceItem[];
  patient: Patient;
  clinic?: Clinic | null;
}

export const InvoicePrintTemplate: React.FC<Props> = ({
  invoice,
  items,
  patient,
  clinic,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const clinicName = clinic?.name || 'مجمع عيادات أفق لطب الأسنان';
  const clinicVat = clinic?.tax_number || '310123456700003';
  const clinicCr = clinic?.cr_number || '1010892341';
  const clinicPhone = clinic?.phone || '011-4567890';
  const clinicAddress = clinic?.address || 'الرياض، المملكة العربية السعودية';

  const totalWithVatSar = (invoice.total_halalas / 100).toFixed(2);
  const vatAmountSar = (invoice.vat_halalas / 100).toFixed(2);
  const subtotalSar = (invoice.subtotal_halalas / 100).toFixed(2);
  const discountSar = (invoice.discount_halalas / 100).toFixed(2);
  const paidSar = (invoice.paid_halalas / 100).toFixed(2);
  const balanceSar = (invoice.balance_halalas / 100).toFixed(2);
  const vatRate = invoice.vat_percent ?? 15;

  const issueDateFormatted = new Date(invoice.issue_date).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const issueTimeFormatted = new Date(invoice.issue_date).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Generate ZATCA Phase 1 & 2 TLV QR Code
  useEffect(() => {
    const fields: ZatcaQrFields = {
      sellerName: clinicName,
      vatNumber: clinicVat,
      timestamp: invoice.issue_date,
      totalWithVat: totalWithVatSar,
      vatAmount: vatAmountSar,
    };

    generateZatcaQrDataUrl(fields, { width: 180, margin: 1 })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate ZATCA QR:', err));
  }, [clinicName, clinicVat, invoice.issue_date, totalWithVatSar, vatAmountSar]);

  const patientFullName = `${patient.first_name} ${patient.father_name || ''} ${patient.family_name}`.trim();

  return (
    <div className="w-full bg-white text-zinc-900 p-8 font-sans print:p-0 print:m-0 print:w-full print:bg-white text-xs leading-relaxed" dir="rtl">
      {/* 1. Header (ترويسة المركز) */}
      <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-5 mb-5">
        {/* Clinic info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {clinic?.logo_path ? (
              <img src={clinic.logo_path} alt={clinicName} className="h-12 w-auto object-contain" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-black text-lg">
                ع
              </div>
            )}
            <div>
              <h1 className="text-lg font-black text-zinc-950">{clinicName}</h1>
              <p className="text-[11px] text-zinc-600 font-medium">مركز متخصص لجراحة وتجميل وطب الأسنان</p>
            </div>
          </div>
          <div className="pt-2 text-[11px] text-zinc-600 space-y-0.5">
            <div>
              <span className="font-semibold text-zinc-700">العنوان: </span>
              <span>{clinicAddress}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>
                <strong className="text-zinc-700">هاتف: </strong>
                <span dir="ltr" className="font-mono">{clinicPhone}</span>
              </span>
              <span>
                <strong className="text-zinc-700">السجل التجاري (CR): </strong>
                <span className="font-mono font-bold text-zinc-800">{clinicCr}</span>
              </span>
            </div>
            <div>
              <strong className="text-zinc-700">الرقم الضريبي للمنشأة (VAT): </strong>
              <span className="font-mono font-bold text-zinc-900">{clinicVat}</span>
            </div>
          </div>
        </div>

        {/* Invoice Title & Meta */}
        <div className="text-left flex flex-col items-end">
          <div className="border border-zinc-900 rounded-md px-3 py-1.5 bg-zinc-50 text-center mb-2">
            <h2 className="text-sm font-black text-zinc-950">فاتورة ضريبية مبسطة</h2>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">
              Simplified Tax Invoice
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-zinc-600">
            <div>
              <span className="text-zinc-500">رقم الفاتورة / No: </span>
              <span className="font-mono font-black text-sm text-zinc-900">{invoice.number}</span>
            </div>
            <div>
              <span className="text-zinc-500">التاريخ / Date: </span>
              <span className="font-mono font-medium text-zinc-800">{issueDateFormatted}</span>
            </div>
            <div>
              <span className="text-zinc-500">الوقت / Time: </span>
              <span className="font-mono font-medium text-zinc-800">{issueTimeFormatted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Patient Data Box (بيانات المريض) */}
      <div className="rounded-xl border border-zinc-300 bg-zinc-50/70 p-3.5 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
        <div>
          <span className="text-zinc-500 block text-[10px]">اسم المريض / Patient Name:</span>
          <span className="font-bold text-zinc-900">{patientFullName}</span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[10px]">رقم الملف / File No:</span>
          <span className="font-mono font-bold text-zinc-900">{patient.code}</span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[10px]">الهوية / الإقامة / ID No:</span>
          <span className="font-mono text-zinc-800">{patient.national_id || '—'}</span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[10px]">رقم الجوال / Phone:</span>
          <span className="font-mono text-zinc-800" dir="ltr">{patient.phone}</span>
        </div>
      </div>

      {/* 3. Items Table (جدول البنود والخدمات) */}
      <div className="border border-zinc-300 rounded-lg overflow-hidden mb-5">
        <table className="w-full text-right border-collapse text-[11px]">
          <thead className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300">
            <tr>
              <th className="p-2.5 text-center w-8">#</th>
              <th className="p-2.5">الوصف / الإجراء الطبي (Description)</th>
              <th className="p-2.5 text-center w-16">السن (Tooth)</th>
              <th className="p-2.5 text-center w-14">الكمية (Qty)</th>
              <th className="p-2.5 text-left w-24">سعر الوحدة (Unit Price)</th>
              <th className="p-2.5 text-left w-20">الخصم (Disc.)</th>
              <th className="p-2.5 text-left w-28">الإجمالي قبل الضريبة (Subtotal)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-zinc-400">
                  علاجات واستشارات سنية متنوعة
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-zinc-50/50">
                  <td className="p-2.5 text-center font-mono text-zinc-500">{idx + 1}</td>
                  <td className="p-2.5 font-bold text-zinc-900">{item.description}</td>
                  <td className="p-2.5 text-center font-mono text-zinc-700">
                    {item.tooth_number ? `#${item.tooth_number}` : 'عام'}
                  </td>
                  <td className="p-2.5 text-center font-mono font-medium">{item.quantity}</td>
                  <td className="p-2.5 text-left font-mono">{(item.unit_price_halalas / 100).toFixed(2)}</td>
                  <td className="p-2.5 text-left font-mono text-rose-600">
                    {item.discount_halalas > 0 ? (item.discount_halalas / 100).toFixed(2) : '0.00'}
                  </td>
                  <td className="p-2.5 text-left font-mono font-bold text-zinc-900">
                    {(item.total_halalas / 100).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Totals and ZATCA Compliant QR Code Section */}
      <div className="grid grid-cols-12 gap-4 items-start mb-6">
        {/* ZATCA QR Code & E-Invoice Accreditation */}
        <div className="col-span-6 rounded-xl border border-zinc-300 p-3.5 bg-zinc-50/60 flex items-center gap-3">
          <div className="w-28 h-28 shrink-0 bg-white border border-zinc-200 rounded-lg p-1 flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="ZATCA TLV QR Code"
                className="w-full h-full object-contain"
              />
            ) : (
              <QrCode className="w-12 h-12 text-zinc-400 animate-pulse" />
            )}
          </div>
          <div className="space-y-1 text-[10px] text-zinc-600">
            <div className="flex items-center gap-1 text-emerald-800 font-bold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>فاتورة إلكترونية معتمدة</span>
            </div>
            <p className="font-semibold text-zinc-900">هيئة الزكاة والضريبة والجمارك (ZATCA)</p>
            <p className="text-zinc-500 leading-tight">
              رمز الاستجابة السريعة (QR) بصيغة TLV مشفرة Base64 مطابق لمتطلبات الفوترة الإلكترونية بالمملكة (المرحلة الأولى والثانية).
            </p>
            <span className="font-mono text-[9px] text-zinc-400 block pt-0.5">
              Fatoora Phase 1 & 2 Compliant TLV
            </span>
          </div>
        </div>

        {/* Totals Breakdown Box */}
        <div className="col-span-6 rounded-xl border border-zinc-300 overflow-hidden text-[11px]">
          <div className="divide-y divide-zinc-200 bg-white">
            <div className="flex justify-between px-3.5 py-1.5">
              <span className="text-zinc-600">إجمالي المبلغ الخاضع للضريبة (Subtotal):</span>
              <span className="font-mono font-bold text-zinc-900">{subtotalSar} ر.س</span>
            </div>

            {invoice.discount_halalas > 0 && (
              <div className="flex justify-between px-3.5 py-1.5 text-rose-600">
                <span>إجمالي الخصم (Total Discount):</span>
                <span className="font-mono font-bold">-{discountSar} ر.س</span>
              </div>
            )}

            <div className="flex justify-between px-3.5 py-1.5">
              <span className="text-zinc-600">
                ضريبة القيمة المضافة ({vatRate}%) VAT:
              </span>
              <span className="font-mono font-bold text-zinc-900">{vatAmountSar} ر.س</span>
            </div>

            <div className="flex justify-between px-3.5 py-2 bg-zinc-900 text-white font-bold text-xs">
              <span>الإجمالي شامل الضريبة (Total with VAT):</span>
              <span className="font-mono text-sm">{totalWithVatSar} ر.س</span>
            </div>

            <div className="flex justify-between px-3.5 py-1.5 bg-zinc-50">
              <span className="text-emerald-700 font-semibold">المبلغ المدفوع (Paid):</span>
              <span className="font-mono font-bold text-emerald-700">{paidSar} ر.س</span>
            </div>

            <div className="flex justify-between px-3.5 py-1.5 bg-zinc-50">
              <span className="text-rose-700 font-semibold">المتبقي بذمة المريض (Balance):</span>
              <span className="font-mono font-bold text-rose-700">{balanceSar} ر.س</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Footer (تذييل: شكر، سياسة الاسترجاع، توقيع) */}
      <div className="border-t border-zinc-300 pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-[10px] text-zinc-600">
          <div>
            <strong className="block text-zinc-800 mb-0.5">شكراً لزيارتكم وثقتكم بخدماتنا:</strong>
            <p>
              نتمنى لكم دوام الصحة والعافية والابتسامة المشرقة. في حال وجود أي استفسار يسعدنا خدمتكم دائماً.
            </p>
          </div>
          <div>
            <strong className="block text-zinc-800 mb-0.5">السياسة المالية وسياسة الاسترجاع:</strong>
            <p>
              المبالغ المدفوعة تخص خدمات وإجراءات طبية مقدمة وتخضع للوائح وزارة الصحة. لا يمكن استرداد قيمة الإجراءات بعد إنجازها طبياً.
            </p>
          </div>
        </div>

        {/* Signature & Seal Block */}
        <div className="grid grid-cols-2 gap-8 pt-3 text-center text-[11px] text-zinc-700">
          <div className="border-t border-dashed border-zinc-400 pt-2">
            <span>توقيع الطبيب المعالج / Doctor Signature</span>
          </div>
          <div className="border-t border-dashed border-zinc-400 pt-2">
            <span>ختم المركز واعتماد المحاسب / Clinic Seal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
