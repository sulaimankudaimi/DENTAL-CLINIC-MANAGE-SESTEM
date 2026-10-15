import React from 'react';
import type { InsuranceClaim, Patient, Invoice, InvoiceItem, InsuranceCompany, Clinic } from '@shared/contracts';
import { Printer, X, FileCheck } from 'lucide-react';

interface Props {
  claim: InsuranceClaim;
  patient?: Patient | null;
  invoice?: Invoice | null;
  invoiceItems?: InvoiceItem[];
  company?: InsuranceCompany | null;
  clinic?: Clinic | null;
  onClose: () => void;
}

export const PrintableClaimForm: React.FC<Props> = ({
  claim,
  patient,
  invoice,
  invoiceItems = [],
  company,
  clinic,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formatSAR = (halalas: number) => {
    return (halalas / 100).toLocaleString('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 my-8 flex flex-col max-h-[92vh]">
        {/* Actions bar (hidden on print) */}
        <div className="print:hidden flex items-center justify-between border-b border-zinc-200 px-6 py-3.5 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 rounded-t-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
            <FileCheck className="h-4 w-4 text-primary" />
            <span>معاينة نموذج مطالبة التأمين الطبي للطباعة</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow hover:bg-primary/90 transition"
            >
              <Printer className="h-4 w-4" />
              طباعة النموذج
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="overflow-y-auto p-8 text-right text-zinc-900 bg-white dark:bg-zinc-900 dark:text-zinc-100 print:p-0 print:m-0 print:w-full">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-5 mb-6">
            <div>
              <h1 className="text-xl font-black text-zinc-950 dark:text-white">
                {clinic?.name || 'عيادات أفق لطب الأسنان'}
              </h1>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                {clinic?.address || 'الرياض، المملكة العربية السعودية'} | هاتف: {clinic?.phone || '0114567890'}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                الرقم الضريبي: <span className="font-mono">{clinic?.tax_number || '310123456700003'}</span>
              </p>
            </div>

            <div className="text-left">
              <div className="inline-block border border-zinc-900 px-3 py-1 text-center rounded-sm">
                <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  DENTAL CLAIM FORM
                </span>
                <span className="block text-sm font-black font-mono">
                  {claim.claim_number}
                </span>
              </div>
              <div className="mt-2 text-xs text-zinc-500 font-mono">
                تاريخ الإصدار: {new Date(claim.submitted_at).toLocaleDateString('ar-SA')}
              </div>
            </div>
          </div>

          <div className="text-center font-bold text-base mb-6 underline underline-offset-4">
            نموذج مطالبة التأمين الطبي لطب وجراحة وتجميل الأسنان
          </div>

          {/* Section 1: Insurance & Patient Information */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
            {/* Patient Box */}
            <div className="rounded-lg border border-zinc-300 p-3.5 bg-zinc-50/50 dark:bg-zinc-800/40">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 pb-1.5 mb-2 flex items-center gap-1.5">
                بيانات المريض (Patient Information)
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">اسم المريض الكامل:</span>
                  <span className="font-bold">
                    {patient ? `${patient.first_name} ${patient.father_name || ''} ${patient.family_name}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">رقم الملف:</span>
                  <span className="font-mono font-bold">{patient?.code || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">رقم الهوية الوطنية / الإقامة:</span>
                  <span className="font-mono">{patient?.national_id || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">الجنس / تاريخ الميلاد:</span>
                  <span>
                    {patient?.gender === 'female' ? 'أنثى' : 'ذكر'} ({patient?.birth_date || '—'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">رقم الجوال:</span>
                  <span className="font-mono">{patient?.phone || '—'}</span>
                </div>
              </div>
            </div>

            {/* Insurance Company Box */}
            <div className="rounded-lg border border-zinc-300 p-3.5 bg-zinc-50/50 dark:bg-zinc-800/40">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 pb-1.5 mb-2 flex items-center gap-1.5">
                جهة التأمين والوثيقة (Insurance Policy)
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">شركة التأمين:</span>
                  <span className="font-bold">{company?.name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">رقم وثيقة / بوليصة التأمين:</span>
                  <span className="font-mono font-bold">{patient?.insurance_policy_no || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">تاريخ انتهاء الوثيقة:</span>
                  <span className="font-mono">{patient?.insurance_expiry || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">نسبة التغطية المعتمدة:</span>
                  <span className="font-bold font-mono">{company?.coverage_percent_default ?? 80}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">رقم الفاتورة المرتبطة:</span>
                  <span className="font-mono">{invoice?.number || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Rendered Treatments Table */}
          <div className="mb-6">
            <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 mb-2">
              الإجراءات والخدمات الطبية المطالب بها (Dental Services & Procedures)
            </h3>
            <table className="w-full border-collapse border border-zinc-300 text-xs">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                  <th className="border border-zinc-300 p-2 text-center w-8">#</th>
                  <th className="border border-zinc-300 p-2 text-right">رمز الإجراء والوصف الطبي</th>
                  <th className="border border-zinc-300 p-2 text-center w-20">رقم السن</th>
                  <th className="border border-zinc-300 p-2 text-center w-16">الكمية</th>
                  <th className="border border-zinc-300 p-2 text-left w-24">السعر (ر.س)</th>
                  <th className="border border-zinc-300 p-2 text-left w-28">المطالب به (ر.س)</th>
                </tr>
              </thead>
              <tbody>
                {invoiceItems.length > 0 ? (
                  invoiceItems.map((item, index) => {
                    const claimedItemHalalas = Math.round((item.total_halalas * (company?.coverage_percent_default ?? 80)) / 100);
                    return (
                      <tr key={item.id} className="border-b border-zinc-200">
                        <td className="border border-zinc-300 p-2 text-center font-mono">{index + 1}</td>
                        <td className="border border-zinc-300 p-2 font-medium">
                          {item.description}
                        </td>
                        <td className="border border-zinc-300 p-2 text-center font-mono">
                          {item.tooth_number ? `سن ${item.tooth_number}` : 'عام'}
                        </td>
                        <td className="border border-zinc-300 p-2 text-center font-mono">{item.quantity}</td>
                        <td className="border border-zinc-300 p-2 text-left font-mono">
                          {formatSAR(item.unit_price_halalas)}
                        </td>
                        <td className="border border-zinc-300 p-2 text-left font-mono font-bold">
                          {formatSAR(claimedItemHalalas)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="border border-zinc-300 p-2 text-center font-mono">1</td>
                    <td className="border border-zinc-300 p-2 font-medium">
                      علاجات واستشارات سنية متنوعة بموجب الفاتورة رقم {invoice?.number || ''}
                    </td>
                    <td className="border border-zinc-300 p-2 text-center font-mono">—</td>
                    <td className="border border-zinc-300 p-2 text-center font-mono">1</td>
                    <td className="border border-zinc-300 p-2 text-left font-mono">{formatSAR(claim.claimed_halalas)}</td>
                    <td className="border border-zinc-300 p-2 text-left font-mono font-bold">
                      {formatSAR(claim.claimed_halalas)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 font-bold">
                  <td colSpan={5} className="border border-zinc-300 p-2 text-left">
                    إجمالي المبلغ المطالب به من التأمين:
                  </td>
                  <td className="border border-zinc-300 p-2 text-left font-mono text-sm text-primary">
                    {formatSAR(claim.claimed_halalas)} ر.س
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Attachments & Diagnosis */}
          <div className="rounded-lg border border-zinc-300 p-3.5 text-xs mb-6">
            <span className="font-bold text-zinc-900 block mb-1">
              المرفقات والتقارير الطبية المرفقة بالمطالبة:
            </span>
            <div className="flex flex-wrap gap-2 text-zinc-600">
              <span className="rounded bg-zinc-100 px-2 py-0.5 border">✓ صورة أشعة بانورامية كاملة</span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 border">✓ التقرير الطبي والتشخيص السريري</span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 border">✓ نسخة الفاتورة الضريبية</span>
            </div>
          </div>

          {/* Signatures & Declarations */}
          <div className="grid grid-cols-2 gap-8 border-t border-zinc-300 pt-6 mt-8 text-xs">
            {/* Patient Consent */}
            <div>
              <span className="font-bold block mb-1">إقرار وتفويض المريض:</span>
              <p className="text-[11px] text-zinc-500 leading-relaxed mb-8">
                أقر أنا الموقع أدناه بصحة البيانات أعلاه وبأنني تلقيت الخدمات الطبية الموضحة، وأفوض العيادة
                بالمطالبة بقيمة العلاج من شركة التأمين المذكورة.
              </p>
              <div className="border-t border-dashed border-zinc-400 pt-2 flex justify-between">
                <span>توقيع المريض / ولي الأمر:</span>
                <span className="font-mono text-zinc-400">التاريخ: .....................</span>
              </div>
            </div>

            {/* Doctor & Clinic Stamp */}
            <div>
              <span className="font-bold block mb-1">تأكيد الطبيب المعالج وختم العيادة:</span>
              <p className="text-[11px] text-zinc-500 leading-relaxed mb-8">
                أشهد أنا الطبيب المعالج بأن الإجراءات الموضحة أعلاه كانت ضرورية علاجياً وتم إنجازها وفق
                الأصول المهنية الطبية.
              </p>
              <div className="border-t border-dashed border-zinc-400 pt-2 flex justify-between">
                <span>توقيع الطبيب وختم المركز:</span>
                <span className="font-mono text-zinc-400">التاريخ: .....................</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
