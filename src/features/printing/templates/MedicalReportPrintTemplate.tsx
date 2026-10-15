import React from 'react';
import type { Clinic } from '@shared/contracts';
import type { MedicalReportData } from '../types';
import { FileCheck, Stethoscope } from 'lucide-react';

interface Props {
  data: MedicalReportData;
  clinic?: Clinic | null;
}

export const MedicalReportPrintTemplate: React.FC<Props> = ({ data, clinic }) => {
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
          <p className="text-[11px] text-zinc-600 font-medium">قسم طب وجراحة الفم والأسنان</p>
          <div className="pt-2 text-[10px] text-zinc-600 space-y-0.5">
            <div>{clinicAddress} | هاتف: <span dir="ltr">{clinicPhone}</span></div>
          </div>
        </div>

        <div className="text-left flex flex-col items-end">
          <div className="border border-zinc-900 rounded-md px-4 py-1.5 bg-zinc-50 text-center mb-2">
            <h2 className="text-sm font-black text-zinc-950">تقرير طبي معتمد</h2>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">
              Official Medical Report
            </span>
          </div>
          <div className="text-[11px] text-zinc-600 space-y-0.5">
            <div>رقم التقرير: <span className="font-mono font-bold text-zinc-900">{data.reportNumber}</span></div>
            <div>تاريخ الإصدار: <span className="font-mono">{dateFormatted}</span></div>
          </div>
        </div>
      </div>

      {/* Patient & Doctor Details Grid */}
      <div className="rounded-xl border border-zinc-300 p-4 bg-zinc-50/50 mb-5 grid grid-cols-2 gap-4 text-[11px]">
        <div className="space-y-1">
          <div><span className="text-zinc-500">اسم المريض: </span><strong className="text-zinc-900 text-xs">{patientFullName}</strong></div>
          <div><span className="text-zinc-500">رقم الملف: </span><span className="font-mono font-bold">{patient.code}</span></div>
          <div><span className="text-zinc-500">الهوية الوطنية / الإقامة: </span><span className="font-mono font-bold">{patient.national_id || '—'}</span></div>
          <div><span className="text-zinc-500">الجنس والعمر: </span><span>{patient.gender === 'male' ? 'ذكر' : 'أنثى'} ({patientAge} سنة)</span></div>
        </div>

        <div className="space-y-1">
          <div><span className="text-zinc-500">الطبيب المعالج: </span><strong className="text-zinc-900 text-xs">{data.dentistName}</strong></div>
          <div><span className="text-zinc-500">التخصص: </span><span>{data.dentistSpecialty || 'استشاري / أخصائي طب الأسنان'}</span></div>
          {data.dentistLicense && (
            <div><span className="text-zinc-500">رقم ترخيص الهيئة: </span><span className="font-mono">{data.dentistLicense}</span></div>
          )}
          <div><span className="text-zinc-500">القسم: </span><span>جراحة وطب الأسنان المتقدم</span></div>
        </div>
      </div>

      {/* Medical Content Sections */}
      <div className="space-y-4 mb-6">
        {/* Chief Complaint */}
        <div className="rounded-lg border border-zinc-200 p-3 bg-white">
          <div className="flex items-center gap-1.5 font-bold text-zinc-900 mb-1">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span>الشكوى الرئيسية (Chief Complaint):</span>
          </div>
          <p className="text-zinc-700 pr-5">{data.chiefComplaint}</p>
        </div>

        {/* Clinical Findings */}
        <div className="rounded-lg border border-zinc-200 p-3 bg-white">
          <div className="font-bold text-zinc-900 mb-1">
            <span>الفحص الإكلينيكي والشعاعي (Clinical & Radiographic Examination):</span>
          </div>
          <p className="text-zinc-700 pr-5">{data.clinicalFindings}</p>
        </div>

        {/* Diagnosis */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="font-bold text-primary mb-1">
            <span>التشخيص الطبي النهائي (Final Diagnosis):</span>
          </div>
          <p className="text-zinc-900 font-semibold pr-5">{data.diagnosis}</p>
        </div>

        {/* Procedures Performed */}
        <div className="rounded-lg border border-zinc-200 p-3 bg-white">
          <div className="font-bold text-zinc-900 mb-1.5">
            <span>الإجراءات والعلاجات الطبية المنجزة (Procedures & Treatment Rendered):</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-zinc-800 pr-2">
            {data.proceduresDone.map((proc, idx) => (
              <li key={idx} className="font-medium">{proc}</li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="rounded-lg border border-zinc-200 p-3 bg-white">
          <div className="font-bold text-zinc-900 mb-1">
            <span>التوصيات والتعليمات الطبية (Recommendations & Care Plan):</span>
          </div>
          <p className="text-zinc-700 pr-5">{data.recommendations}</p>
        </div>
      </div>

      {/* Official Declaration */}
      <div className="rounded-lg border border-zinc-300 p-3 bg-zinc-50 mb-8 text-[10px] text-zinc-600 flex items-center gap-2">
        <FileCheck className="h-5 w-5 text-emerald-600 shrink-0" />
        <span>
          أُعطي هذا التقرير الطبي بناءً على طلب المريض لتقديمه إلى الجهات المعنية ذات الاختصاص، دون أدنى مسؤولية على المركز تجاه حقوق الغير.
        </span>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-12 pt-6 text-center text-xs">
        <div className="border-t border-dashed border-zinc-400 pt-3">
          <span className="block font-bold mb-1">توقيع وترخيص الطبيب المعالج</span>
          <span className="text-zinc-400 text-[10px]">التوقيع: ................................</span>
        </div>
        <div className="border-t border-dashed border-zinc-400 pt-3">
          <span className="block font-bold mb-1">ختم الإدارة الطبية والمركز</span>
          <span className="text-zinc-400 text-[10px]">الختم الرسمي</span>
        </div>
      </div>
    </div>
  );
};
