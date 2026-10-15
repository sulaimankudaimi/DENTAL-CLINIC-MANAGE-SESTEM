import React, { useRef } from 'react';
import type { TreatmentPlan, TreatmentPlanItem, Procedure, Patient, User, Clinic } from '@shared/contracts';
import { formatCurrency, formatDateAr } from '@/lib/formatters';
import { Button } from '@/components/ui/Button';
import {
  Printer,
  X,
  FileText,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react';

export interface PatientPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TreatmentPlan;
  items: TreatmentPlanItem[];
  procedures: Procedure[];
  patient?: Patient | null;
  dentist?: User | null;
  clinic?: Clinic | null;
  insuranceCoveragePercent?: number;
}

export const PatientPresentationModal: React.FC<PatientPresentationModalProps> = ({
  isOpen,
  onClose,
  plan,
  items,
  procedures,
  patient,
  dentist,
  clinic,
  insuranceCoveragePercent = 0,
}) => {
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const patientName = [patient?.first_name, patient?.father_name, patient?.family_name]
    .filter(Boolean)
    .join(' ') || patient?.code || 'المريض';

  const handlePrint = () => {
    window.print();
  };

  const getProcedure = (procId: string) => {
    return procedures.find((p) => p.id === procId);
  };

  // Group items by phase
  const phases = Array.from(new Set(items.map((i) => i.phase || 1))).sort((a, b) => a - b);

  // Financial calculations down to the halala
  let subtotalHalalas = 0;
  let discountHalalas = 0;
  items.forEach((item) => {
    const gross = (item.unit_price_halalas || 0) * (item.quantity || 1);
    const disc = item.discount_halalas || 0;
    subtotalHalalas += gross;
    discountHalalas += disc;
  });

  const netAfterDiscountHalalas = Math.max(0, subtotalHalalas - discountHalalas);
  const insuranceAmountHalalas = Math.round(
    netAfterDiscountHalalas * ((insuranceCoveragePercent || 0) / 100)
  );
  const patientShareHalalas = Math.max(0, netAfterDiscountHalalas - insuranceAmountHalalas);

  const phaseTitles: Record<number, string> = {
    1: 'المرحلة 1: التدخل العاجل وتسكين الألم والسيطرة على العدوى',
    2: 'المرحلة 2: العلاج الترميمي اللبي وجذور الأسنان',
    3: 'المرحلة 3: التركيبات والتأهيل التجميلي النهائي والوقاية',
    4: 'المرحلة 4: المتابعة الدورية وجلسات الصيانة',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[96vh]">
        {/* Top Action Bar (hidden in print) */}
        <div className="print:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-brand-navy flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#1E4E9C]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                شاشة عرض ومناقشة الخطة العلاجية مع المريض
              </h3>
              <p className="text-[11px] text-slate-500">
                عرض مالي وسريري تفصيلي جاهز للطباعة وتوقيع المريض والموافقة المستنيرة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
              className="text-xs shadow-sm bg-[#1E4E9C]"
            >
              طباعة الخطة / حفظ PDF
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div
          ref={printContentRef}
          className="p-8 sm:p-10 overflow-y-auto space-y-6 text-right bg-white print:p-0 print:m-0 print:overflow-visible"
        >
          {/* Document Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-[#1E4E9C] text-white flex items-center justify-center font-bold text-lg">
                  🦷
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-slate-900">
                    {clinic?.name || 'عيادة أفق لطب وجراحة وتجميل الأسنان'}
                  </h1>
                  <p className="text-xs text-slate-500">
                    {clinic?.city || 'الرياض'} — {clinic?.address || 'طريق الملك فهد، حي الملقا'}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-600 space-x-3 space-x-reverse font-mono">
                <span>هاتف: {clinic?.phone || '0114567890'}</span>
                {clinic?.tax_number && <span>الرقم الضريبي: {clinic.tax_number}</span>}
              </div>
            </div>

            <div className="text-left">
              <span className="inline-block px-3 py-1 rounded bg-blue-50 border border-blue-200 text-[#1E4E9C] text-xs font-bold font-mono">
                PLAN: #{plan.id.slice(0, 8).toUpperCase()}
              </span>
              <div className="text-xs text-slate-600 mt-1">
                تاريخ الخطة: <span className="font-semibold">{formatDateAr(plan.created_at)}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                حالة الخطة: <span className="font-bold text-slate-800">خطة علاجية معتمدة</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block">عنوان الخطة العلاجية:</span>
              <h2 className="text-base font-extrabold text-[#1E4E9C]">{plan.title}</h2>
            </div>
            {dentist && (
              <div className="text-left">
                <span className="text-[11px] text-slate-500 font-semibold block">الطبيب المعالج:</span>
                <span className="text-xs font-bold text-slate-800">
                  د. {dentist.full_name} ({dentist.specialty || 'طبيب أسنان'})
                </span>
              </div>
            )}
          </div>

          {/* Patient Demographics */}
          {patient && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">اسم المريض:</span>
                <span className="font-bold text-slate-900">{patientName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">رقم الملف الطبي:</span>
                <span className="font-mono font-bold text-[#1E4E9C]">{patient.code}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">رقم الهوية / الإقامة:</span>
                <span className="font-mono text-slate-800">{patient.national_id || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">رقم الجوال:</span>
                <span className="font-mono text-slate-800" dir="ltr">{patient.phone}</span>
              </div>
            </div>
          )}

          {/* Phased Roadmap Table */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Stethoscope className="w-4 h-4 text-[#1E4E9C]" />
              جدول مراحل الإجراءات السريرية المتفق عليها
            </h3>

            {phases.map((phaseNum) => {
              const phaseItems = items.filter((i) => (i.phase || 1) === phaseNum);
              if (phaseItems.length === 0) return null;

              return (
                <div key={phaseNum} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100/90 px-4 py-2 text-xs font-bold text-slate-800 border-b border-slate-200 flex items-center justify-between">
                    <span>{phaseTitles[phaseNum] || `المرحلة ${phaseNum}`}</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      {phaseItems.length} إجراءات
                    </span>
                  </div>

                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="p-2.5">الإجراء السريري</th>
                        <th className="p-2.5 text-center">السن</th>
                        <th className="p-2.5 text-center">السطح</th>
                        <th className="p-2.5 text-center">الكمية</th>
                        <th className="p-2.5 text-center">سعر الوحدة</th>
                        <th className="p-2.5 text-center">الخصم</th>
                        <th className="p-2.5 text-left pl-4">المجموع الصافي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {phaseItems.map((item) => {
                        const proc = getProcedure(item.procedure_id);
                        const lineGross = (item.unit_price_halalas || 0) * (item.quantity || 1);
                        const lineNet = Math.max(0, lineGross - (item.discount_halalas || 0));

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-900">
                              {proc ? proc.name_ar : 'إجراء علاجي'}
                              {proc?.code && (
                                <span className="text-[10px] font-mono text-slate-400 mr-2">
                                  ({proc.code})
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold text-[#1E4E9C]">
                              {item.tooth_number ? `#${item.tooth_number}` : 'عام'}
                            </td>
                            <td className="p-2.5 text-center text-slate-600 font-mono">
                              {item.surface || '—'}
                            </td>
                            <td className="p-2.5 text-center font-medium text-slate-800">
                              {item.quantity || 1}
                            </td>
                            <td className="p-2.5 text-center text-slate-700">
                              {formatCurrency(item.unit_price_halalas)}
                            </td>
                            <td className="p-2.5 text-center text-rose-600">
                              {item.discount_halalas > 0 ? `-${formatCurrency(item.discount_halalas)}` : '—'}
                            </td>
                            <td className="p-2.5 text-left pl-4 font-bold text-slate-900">
                              {formatCurrency(lineNet)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* Financial Breakdown Table matching exactly to halala */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              البيان المالي الشامل لخطة العلاج
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">إجمالي تكلفة الإجراءات</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {formatCurrency(subtotalHalalas)}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">إجمالي الخصم المعتمد</span>
                <span className="text-sm font-bold text-rose-600 mt-1 block">
                  {discountHalalas > 0 ? `-${formatCurrency(discountHalalas)}` : '0.00 ر.س'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">
                  تغطية التأمين المتوقعة ({insuranceCoveragePercent}%)
                </span>
                <span className="text-sm font-bold text-teal-700 mt-1 block">
                  {insuranceAmountHalalas > 0 ? `-${formatCurrency(insuranceAmountHalalas)}` : '0.00 ر.س'}
                </span>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200">
                <span className="text-[#1E4E9C] font-bold block text-[11px]">
                  صافي المبلغ المستحق على المريض
                </span>
                <span className="text-base font-extrabold text-[#1E4E9C] mt-0.5 block">
                  {formatCurrency(patientShareHalalas)}
                </span>
              </div>
            </div>

            {plan.notes && (
              <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                <strong className="text-slate-800">ملاحظات الطبيب: </strong>
                {plan.notes}
              </div>
            )}
          </div>

          {/* Legal Consent & Signature Section */}
          <div className="border border-slate-300 rounded-xl p-5 space-y-4 text-xs bg-white">
            <h4 className="font-bold text-slate-900">إقرار وموافقة المريض المستنيرة:</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              أقر أنا الموقع أدناه بأنني قد اطلعت على الخطة العلاجية المقترحة والمراحل الموضحة أعلاه،
              وقد قام الطبيب المعالج بشرح الإجراءات والبدائل والمخاطر المحتملة والتكاليف المالية المترتبة
              عليها، وأوافق بموجب هذا على البدء في تنفيذ خطة العلاج وفق الجداول المحددة.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200">
              <div className="space-y-8">
                <div className="space-y-1">
                  <span className="text-slate-500 block text-[11px]">اسم وتوقيع الطبيب المعالج:</span>
                  <span className="font-bold text-slate-800">د. {dentist?.full_name || 'الطبيب المعالج'}</span>
                </div>
                <div className="border-b border-dashed border-slate-400 w-48" />
                <span className="text-[10px] text-slate-400 block font-mono">
                  التاريخ: {new Date().toISOString().split('T')[0]}
                </span>
              </div>

              <div className="space-y-8">
                <div className="space-y-1">
                  <span className="text-slate-500 block text-[11px]">اسم وتوقيع المريض أو الولي الشرعي:</span>
                  <span className="font-bold text-slate-800">{patientName}</span>
                </div>
                <div className="border-b border-dashed border-slate-400 w-48" />
                <span className="text-[10px] text-slate-400 block font-mono">التوقيع والموافقة: ________________</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer (hidden in print) */}
        <div className="print:hidden p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            يمكنك طباعة هذا المستند كملف PDF لتسليمه للمريض أو توقيعه رقمياً
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            إغلاق
          </Button>
        </div>
      </div>
    </div>
  );
};
