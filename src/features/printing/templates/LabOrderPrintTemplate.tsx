import React from 'react';
import type { Clinic } from '@shared/contracts';
import type { LabOrderPrintData } from '../types';
import { Sparkles, Clock } from 'lucide-react';

interface Props {
  data: LabOrderPrintData;
  clinic?: Clinic | null;
}

export const LabOrderPrintTemplate: React.FC<Props> = ({ data, clinic }) => {
  const clinicName = clinic?.name || 'مجمع عيادات أفق لطب الأسنان';
  const clinicPhone = clinic?.phone || '011-4567890';
  const clinicAddress = clinic?.address || 'الرياض، المملكة العربية السعودية';

  const patient = data.patient;
  const patientFullName = `${patient.first_name} ${patient.father_name || ''} ${patient.family_name}`.trim();

  const orderDateFormatted = new Date(data.orderDate).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const deliveryDateFormatted = new Date(data.deliveryDate).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const patientAge =
    (patient as any).age ??
    (patient.birth_date
      ? Math.abs(new Date(Date.now() - new Date(patient.birth_date).getTime()).getUTCFullYear() - 1970)
      : '—');

  return (
    <div className="w-full bg-white text-zinc-900 p-8 font-sans print:p-0 print:m-0 print:w-full print:bg-white text-xs leading-relaxed" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-5 mb-5">
        <div>
          <h1 className="text-lg font-black text-zinc-950">{clinicName}</h1>
          <p className="text-[11px] text-zinc-600 font-medium">قسم التعويضات السنية والتركيبات المتقدمة</p>
          <div className="pt-2 text-[10px] text-zinc-600 space-y-0.5">
            <div>{clinicAddress} | هاتف: <span dir="ltr">{clinicPhone}</span></div>
          </div>
        </div>

        <div className="text-left flex flex-col items-end">
          <div className="border border-zinc-900 rounded-md px-4 py-1.5 bg-zinc-50 text-center mb-2">
            <h2 className="text-sm font-black text-zinc-950">أمر تشغيل معمل أسنان</h2>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">
              Dental Lab Work Order
            </span>
          </div>
          <div className="text-[11px] text-zinc-600 space-y-0.5">
            <div>رقم الطلب: <span className="font-mono font-bold text-zinc-900">{data.orderNumber}</span></div>
            <div>تاريخ الإرسال: <span className="font-mono">{orderDateFormatted}</span></div>
          </div>
        </div>
      </div>

      {/* Lab & Patient Meta */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="rounded-xl border border-zinc-300 p-3.5 bg-zinc-50/50 space-y-1 text-[11px]">
          <span className="text-zinc-500 block text-[10px] font-bold">المعمل / المختبر الموجه إليه:</span>
          <div className="font-bold text-zinc-900 text-sm">{data.labName}</div>
          <div className="text-zinc-600">طبيب الحالة: <strong className="text-zinc-900">{data.dentistName}</strong></div>
        </div>

        <div className="rounded-xl border border-zinc-300 p-3.5 bg-zinc-50/50 space-y-1 text-[11px]">
          <span className="text-zinc-500 block text-[10px] font-bold">بيانات المريض / التعويض السني:</span>
          <div className="font-bold text-zinc-900 text-sm">{patientFullName}</div>
          <div className="flex items-center gap-4 text-zinc-600">
            <span>الملف: <strong className="font-mono text-zinc-900">{patient.code}</strong></span>
            <span>الجنس: <strong>{patient.gender === 'male' ? 'ذكر' : 'أنثى'}</strong></span>
            <span>العمر: <strong className="font-mono">{patientAge}</strong></span>
          </div>
        </div>
      </div>

      {/* Deadline Alert Banner */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-3.5 mb-5 flex items-center justify-between text-amber-900">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold block text-xs">موعد التسليم والتجربة السريرية النهائي:</span>
            <span className="text-[11px]">يرجى تسليم العمل للعيادة قبل الموعد بـ 24 ساعة على الأقل</span>
          </div>
        </div>
        <div className="text-left font-mono font-black text-base text-amber-950">
          {deliveryDateFormatted}
        </div>
      </div>

      {/* Restoration Specifications */}
      <div className="rounded-xl border border-zinc-300 p-4 mb-5 space-y-3 text-xs bg-white">
        <div className="grid grid-cols-3 gap-4 border-b border-zinc-200 pb-3">
          <div>
            <span className="text-zinc-500 block text-[11px]">نوع التعويض المطلوب:</span>
            <span className="font-bold text-zinc-900">{data.restorationType}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">أرقام الأسنان (Teeth):</span>
            <span className="font-mono font-bold text-primary text-sm">
              {data.teethNumbers.length > 0 ? data.teethNumbers.map((t) => `#${t}`).join(', ') : 'غير محدد'}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[11px]">درجة اللون (Shade):</span>
            <span className="font-mono font-bold text-amber-700 text-sm flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              {data.shade}
            </span>
          </div>
        </div>

        {data.materials && (
          <div className="border-b border-zinc-200 pb-3">
            <span className="text-zinc-500 block text-[11px]">المواد الخام المعتمدة:</span>
            <span className="font-medium text-zinc-800">{data.materials}</span>
          </div>
        )}

        <div>
          <span className="text-zinc-500 block text-[11px] font-bold mb-1">تعليمات وتفاصيل العمل المخبري:</span>
          <div className="rounded-lg bg-zinc-50 p-3 text-zinc-800 font-medium border border-zinc-200 text-[11px] leading-relaxed whitespace-pre-line">
            {data.instructions || 'يرجى مراعاة نقاط التماس (Contacts) والإطباق الدقيق والتشريح الطبيعي للسطح الطاحن.'}
          </div>
        </div>
      </div>

      {/* Quality Check Checklist */}
      <div className="rounded-lg border border-zinc-200 p-3 bg-zinc-50/50 mb-8 text-[11px]">
        <span className="font-bold text-zinc-800 block mb-1">معايير فحص الجودة والتسليم:</span>
        <div className="grid grid-cols-3 gap-2 text-zinc-600 text-[10px]">
          <div>[  ] تطابق الإطباق (Occlusion)</div>
          <div>[  ] دقة الحواف (Marginal Fit)</div>
          <div>[  ] درجة اللون والشفافية (Translucency)</div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-12 pt-6 text-center text-xs">
        <div className="border-t border-dashed border-zinc-400 pt-3">
          <span className="block font-bold mb-1">توقيع طبيب الحالة المعالج</span>
          <span className="text-zinc-400 text-[10px]">التوقيع: ................................</span>
        </div>
        <div className="border-t border-dashed border-zinc-400 pt-3">
          <span className="block font-bold mb-1">استلام وتوقيع مسؤول معمل الأسنان</span>
          <span className="text-zinc-400 text-[10px]">الاسم والتوقيع: ................................</span>
        </div>
      </div>
    </div>
  );
};
