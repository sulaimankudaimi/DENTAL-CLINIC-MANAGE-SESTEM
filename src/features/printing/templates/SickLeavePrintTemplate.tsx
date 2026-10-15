import React from 'react';
import type { Clinic } from '@shared/contracts';
import type { SickLeaveData } from '../types';
import { Calendar, ShieldCheck } from 'lucide-react';

interface Props {
  data: SickLeaveData;
  clinic?: Clinic | null;
}

export const SickLeavePrintTemplate: React.FC<Props> = ({ data, clinic }) => {
  const clinicName = clinic?.name || 'مجمع عيادات أفق لطب الأسنان';
  const clinicPhone = clinic?.phone || '011-4567890';
  const clinicAddress = clinic?.address || 'الرياض، المملكة العربية السعودية';

  const patient = data.patient;
  const patientFullName = `${patient.first_name} ${patient.father_name || ''} ${patient.family_name}`.trim();
  const dateFormatted = new Date(data.date).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const startDateFormatted = new Date(data.startDate).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const endDateFormatted = new Date(data.endDate).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getDaysInWords = (days: number) => {
    switch (days) {
      case 1:
        return 'يوم واحد فقط';
      case 2:
        return 'يومان اثنان فقط';
      case 3:
        return 'ثلاثة أيام فقط';
      case 4:
        return 'أربعة أيام فقط';
      case 5:
        return 'خمسة أيام فقط';
      case 6:
        return 'ستة أيام فقط';
      case 7:
        return 'أسبوع كامل (سبعة أيام)';
      default:
        return `${days} يوماً`;
    }
  };

  return (
    <div className="w-full bg-white text-zinc-900 p-8 font-sans print:p-0 print:m-0 print:w-full print:bg-white text-xs leading-relaxed" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-5 mb-6">
        <div>
          <h1 className="text-lg font-black text-zinc-950">{clinicName}</h1>
          <p className="text-[11px] text-zinc-600 font-medium">قسم طب وجراحة الفم والأسنان</p>
          <div className="pt-2 text-[10px] text-zinc-600 space-y-0.5">
            <div>{clinicAddress} | هاتف: <span dir="ltr">{clinicPhone}</span></div>
          </div>
        </div>

        <div className="text-left flex flex-col items-end">
          <div className="border border-zinc-900 rounded-md px-4 py-1.5 bg-zinc-50 text-center mb-2">
            <h2 className="text-sm font-black text-zinc-950">إشعار إجازة مرضية</h2>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">
              Sick Leave Certificate
            </span>
          </div>
          <div className="text-[11px] text-zinc-600 space-y-0.5">
            <div>رقم الإشعار: <span className="font-mono font-bold text-zinc-900">{data.leaveNumber}</span></div>
            <div>تاريخ التحرير: <span className="font-mono">{dateFormatted}</span></div>
          </div>
        </div>
      </div>

      {/* Patient & Doctor Box */}
      <div className="rounded-xl border border-zinc-300 p-4 bg-zinc-50/50 mb-6 grid grid-cols-2 gap-4 text-[11px]">
        <div className="space-y-1">
          <div><span className="text-zinc-500">اسم المريض: </span><strong className="text-zinc-900 text-xs">{patientFullName}</strong></div>
          <div><span className="text-zinc-500">الهوية الوطنية / الإقامة: </span><span className="font-mono font-bold text-zinc-900">{patient.national_id || '—'}</span></div>
          <div><span className="text-zinc-500">رقم الملف الطبي: </span><span className="font-mono font-bold">{patient.code}</span></div>
          <div><span className="text-zinc-500">جهة العمل: </span><span>{patient.occupation || 'غير محدد'}</span></div>
        </div>

        <div className="space-y-1">
          <div><span className="text-zinc-500">الطبيب المعالج: </span><strong className="text-zinc-900 text-xs">{data.attendingDoctor}</strong></div>
          <div><span className="text-zinc-500">التخصص الطبي: </span><span>{data.doctorSpecialty || 'جراحة الفم والأسنان'}</span></div>
          {data.doctorLicense && (
            <div><span className="text-zinc-500">ترخيص الهيئة الصحية: </span><span className="font-mono font-bold">{data.doctorLicense}</span></div>
          )}
        </div>
      </div>

      {/* Duration Highlight Box */}
      <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5 mb-6 text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-primary font-bold">
          <Calendar className="h-5 w-5" />
          <span className="text-sm">مدة الإجازة المرضية الممنوحة</span>
        </div>

        <div className="text-2xl font-black text-zinc-950 font-mono">
          {data.daysCount} أيام <span className="text-base font-bold text-zinc-600">({getDaysInWords(data.daysCount)})</span>
        </div>

        <div className="flex items-center justify-center gap-8 text-xs font-semibold text-zinc-800 pt-1">
          <div>
            <span className="text-zinc-500 block text-[10px]">تبدأ من تاريخ:</span>
            <span className="font-mono font-bold">{startDateFormatted}</span>
          </div>
          <div className="text-zinc-400">←</div>
          <div>
            <span className="text-zinc-500 block text-[10px]">وحتى تاريخ:</span>
            <span className="font-mono font-bold">{endDateFormatted}</span>
          </div>
        </div>
      </div>

      {/* Diagnosis & Recommendations */}
      <div className="space-y-3 mb-8">
        <div className="rounded-lg border border-zinc-200 p-3 bg-white">
          <strong className="text-zinc-700 block mb-0.5">التشخيص والحالة الطبية:</strong>
          <p className="text-zinc-900 font-medium">{data.diagnosis}</p>
        </div>

        <div className="rounded-lg border border-zinc-200 p-3 bg-white">
          <strong className="text-zinc-700 block mb-0.5">التوصيات الطبية:</strong>
          <p className="text-zinc-700">
            {data.recommendations || 'يوصى بالراحة التامة وتجنب الإجهاد البدني والالتزام بالعلاجات الموصوفة.'}
          </p>
        </div>

        <div className="rounded-lg border border-emerald-300 bg-emerald-50/60 p-2.5 text-[10px] text-emerald-900 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            هذا التقرير صادر رسميّاً وموثق بسجلات المركز الطبي وفق المعايير الطبية المعتمدة للتقارير والإجازات المرضية.
          </span>
        </div>
      </div>

      {/* Signatures & Seal */}
      <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs">
        <div className="border-t border-dashed border-zinc-400 pt-3">
          <span className="block font-bold mb-1">توقيع الطبيب المعالج</span>
          <span className="text-zinc-400 text-[10px]">التوقيع: ................................</span>
        </div>
        <div className="border-t border-dashed border-zinc-400 pt-3">
          <span className="block font-bold mb-1">ختم الإدارة الطبية والاعتماد</span>
          <span className="text-zinc-400 text-[10px]">الختم الرسمي للمركز</span>
        </div>
      </div>
    </div>
  );
};
