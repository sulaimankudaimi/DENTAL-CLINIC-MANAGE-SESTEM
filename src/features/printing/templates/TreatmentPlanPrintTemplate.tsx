import React from 'react';
import type { Clinic } from '@shared/contracts';
import type { TreatmentPlanPrintData, PrintableTreatmentPlanItem } from '../types';
import { Calendar, CheckCircle2 } from 'lucide-react';

interface Props {
  data: TreatmentPlanPrintData;
  clinic?: Clinic | null;
}

export const TreatmentPlanPrintTemplate: React.FC<Props> = ({ data, clinic }) => {
  const clinicName = clinic?.name || 'مجمع عيادات أفق لطب الأسنان';
  const clinicPhone = clinic?.phone || '011-4567890';
  const clinicAddress = clinic?.address || 'الرياض، المملكة العربية السعودية';

  const patient = data.patient;
  const patientFullName = `${patient.first_name} ${patient.father_name || ''} ${patient.family_name}`.trim();
  const planDate = new Date(data.plan.created_at).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalCostSar = (data.plan.total_halalas / 100).toFixed(2);

  return (
    <div className="w-full bg-white text-zinc-900 p-8 font-sans print:p-0 print:m-0 print:w-full print:bg-white text-xs leading-relaxed" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-5 mb-5">
        <div>
          <h1 className="text-lg font-black text-zinc-950">{clinicName}</h1>
          <p className="text-[11px] text-zinc-600 font-medium">قسم الاستشارات وخطط العلاج الشاملة</p>
          <div className="pt-2 text-[10px] text-zinc-600 space-y-0.5">
            <div>{clinicAddress} | هاتف: <span dir="ltr">{clinicPhone}</span></div>
          </div>
        </div>

        <div className="text-left flex flex-col items-end">
          <div className="border border-zinc-900 rounded-md px-4 py-1.5 bg-zinc-50 text-center mb-2">
            <h2 className="text-sm font-black text-zinc-950">خطة علاج الأسنان</h2>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">
              Patient Treatment Plan
            </span>
          </div>
          <div className="text-[11px] text-zinc-600 space-y-0.5">
            <div>رقم الخطة: <span className="font-mono font-bold text-zinc-900">PLN-{(data.plan.id || '').slice(0, 8).toUpperCase()}</span></div>
            <div>تاريخ الخطة: <span className="font-mono">{planDate}</span></div>
          </div>
        </div>
      </div>

      {/* Patient & Doctor Box */}
      <div className="rounded-xl border border-zinc-300 p-4 bg-zinc-50/50 mb-5 grid grid-cols-2 gap-4 text-[11px]">
        <div className="space-y-1">
          <div><span className="text-zinc-500">اسم المريض: </span><strong className="text-zinc-900 text-xs">{patientFullName}</strong></div>
          <div><span className="text-zinc-500">رقم الملف: </span><span className="font-mono font-bold text-zinc-900">{patient.code}</span></div>
          <div><span className="text-zinc-500">رقم الجوال: </span><span className="font-mono" dir="ltr">{patient.phone}</span></div>
        </div>

        <div className="space-y-1">
          <div><span className="text-zinc-500">طبيب الخطة المعالج: </span><strong className="text-zinc-900 text-xs">{data.dentistName}</strong></div>
          <div><span className="text-zinc-500">عنوان الخطة: </span><span className="font-semibold text-zinc-800">{data.plan.title}</span></div>
          <div>
            <span className="text-zinc-500">حالة الخطة: </span>
            <span className="font-bold text-emerald-700">
              {data.plan.status === 'accepted' ? 'معتمدة من المريض' : 'خطة مقترحة'}
            </span>
          </div>
        </div>
      </div>

      {/* Plan Items Table */}
      <div className="border border-zinc-300 rounded-lg overflow-hidden mb-5">
        <table className="w-full text-right border-collapse text-[11px]">
          <thead className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300">
            <tr>
              <th className="p-2.5 text-center w-8">#</th>
              <th className="p-2.5 text-center w-20">المرحلة</th>
              <th className="p-2.5 text-center w-16">السن</th>
              <th className="p-2.5">الإجراء المقترح (Proposed Procedure)</th>
              <th className="p-2.5 text-center w-24">الحالة</th>
              <th className="p-2.5 text-left w-28">التكلفة التقديرية</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-zinc-400">
                  لا توجد إجراءات مسجلة في هذه الخطة
                </td>
              </tr>
            ) : (
              data.items.map((rawItem, idx) => {
                const item = rawItem as PrintableTreatmentPlanItem;
                const priceHalalas = item.unit_price_halalas ?? 0;
                return (
                  <tr key={item.id || idx} className="hover:bg-zinc-50/50">
                    <td className="p-2.5 text-center font-mono text-zinc-500">{idx + 1}</td>
                    <td className="p-2.5 text-center font-semibold text-primary">المرحلة {item.phase || 1}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-zinc-800">
                      {item.tooth_number ? `#${item.tooth_number}` : 'عام'}
                    </td>
                    <td className="p-2.5 font-bold text-zinc-900">
                      <div>{item.procedure_name || `إجراء سني رقم ${idx + 1}`}</div>
                      {item.notes && <div className="text-[10px] font-normal text-zinc-500">{item.notes}</div>}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full">
                        {item.status === 'completed' ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>تم الإنجاز</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="h-3 w-3 text-zinc-400" />
                            <span>مجدول</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-2.5 text-left font-mono font-bold text-zinc-900">
                      {(priceHalalas / 100).toFixed(2)} ر.س
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Total & Payment Plan Note */}
      <div className="flex justify-between items-center rounded-xl border border-zinc-300 p-4 bg-zinc-50 mb-6">
        <div className="text-[11px] text-zinc-600 space-y-1">
          <div className="font-bold text-zinc-800">شروط وخيارات السداد:</div>
          <div>• يمكن تقسيم السداد على دفعات ومراحل وفق جدول المواعيد المعتمد.</div>
          <div>• التكلفة التقديرية تشمل الفحص والمتابعة طوال فترة العلاج.</div>
        </div>
        <div className="text-left">
          <span className="text-[11px] text-zinc-500 block">إجمالي التكلفة التقديرية:</span>
          <span className="text-xl font-black font-mono text-primary">{totalCostSar} ر.س</span>
        </div>
      </div>

      {/* Patient Consent & Agreement Block */}
      <div className="border border-zinc-200 rounded-lg p-3 bg-white mb-8 text-[10px] text-zinc-600 leading-relaxed">
        <strong className="text-zinc-800 block mb-0.5">إقرار وموافقة المريض (Patient Informed Consent):</strong>
        لقد قام الطبيب المعالج بشرح خطة العلاج الموضحة أعلاه، والخيارات والبدائل المتاحة، والتكاليف المتوقعة والمضاعفات المحتملة. وأوافق بموجب هذا على البدء في تنفيذ خطة العلاج المحددة.
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-12 pt-6 text-center text-xs">
        <div className="border-t border-dashed border-zinc-400 pt-3">
          <span className="block font-bold mb-1">موافقة وتوقيع المريض</span>
          <span className="text-zinc-400 text-[10px]">التوقيع: ................................</span>
        </div>
        <div className="border-t border-dashed border-zinc-400 pt-3">
          <span className="block font-bold mb-1">اعتماد الطبيب المعالج والمركز</span>
          <span className="text-zinc-400 text-[10px]">التوقيع والختم</span>
        </div>
      </div>
    </div>
  );
};
