import React from 'react';
import type { Clinic } from '@shared/contracts';
import type { PrescriptionData } from '../types';
import { Pill, AlertTriangle } from 'lucide-react';

interface Props {
  data: PrescriptionData;
  clinic?: Clinic | null;
}

export const PrescriptionPrintTemplate: React.FC<Props> = ({ data, clinic }) => {
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
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-sm font-black text-zinc-950 font-serif">Rx</span>
              <h2 className="text-sm font-black text-zinc-950">وصفة طبية</h2>
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">
              Medical Prescription
            </span>
          </div>
          <div className="text-[11px] text-zinc-600 space-y-0.5">
            <div>رقم الوصفة: <span className="font-mono font-bold text-zinc-900">{data.prescriptionNumber}</span></div>
            <div>التاريخ: <span className="font-mono">{dateFormatted}</span></div>
          </div>
        </div>
      </div>

      {/* Doctor & Patient Info Boxes */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Doctor Info */}
        <div className="rounded-xl border border-zinc-300 p-3 bg-zinc-50/50 space-y-1 text-[11px]">
          <span className="text-zinc-500 block text-[10px] font-bold">الطبيب المعالج / Prescribing Doctor:</span>
          <div className="font-bold text-zinc-900 text-xs">{data.dentistName}</div>
          <div className="text-zinc-600">{data.dentistSpecialty || 'طبيب أسنان عام وجراحة الفم'}</div>
          {data.dentistLicense && (
            <div className="text-zinc-500 font-mono text-[10px]">ترخيص الهيئة: {data.dentistLicense}</div>
          )}
        </div>

        {/* Patient Info */}
        <div className="rounded-xl border border-zinc-300 p-3 bg-zinc-50/50 space-y-1 text-[11px]">
          <span className="text-zinc-500 block text-[10px] font-bold">بيانات المريض / Patient Information:</span>
          <div className="font-bold text-zinc-900 text-xs">{patientFullName}</div>
          <div className="flex items-center gap-3 text-zinc-600">
            <span>الملف: <strong className="font-mono text-zinc-900">{patient.code}</strong></span>
            <span>العمر: <strong className="font-mono text-zinc-900">{patientAge}</strong> سنة</span>
            <span>الجنس: <strong>{patient.gender === 'male' ? 'ذكر' : 'أنثى'}</strong></span>
          </div>
          <div className="text-zinc-500 font-mono text-[10px]" dir="ltr">الهاتف: {patient.phone}</div>
        </div>
      </div>

      {/* Diagnosis & Allergies Alert */}
      <div className="mb-5 space-y-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-2.5 text-[11px]">
          <strong className="text-zinc-700">التشخيص الطبي (Diagnosis): </strong>
          <span className="text-zinc-900 font-medium">{data.diagnosis}</span>
        </div>

        {data.allergies && data.allergies.length > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-[11px] flex items-center gap-2 text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <strong>تحذير حساسية دوائية: </strong>
              <span>{data.allergies.join('، ')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Medications Table */}
      <div className="border border-zinc-300 rounded-lg overflow-hidden mb-6">
        <table className="w-full text-right border-collapse text-[11px]">
          <thead className="bg-zinc-100 text-zinc-800 font-bold border-b border-zinc-300">
            <tr>
              <th className="p-2.5 text-center w-8">#</th>
              <th className="p-2.5">اسم الدواء والشكل الصيدلاني (Medication & Form)</th>
              <th className="p-2.5 text-center w-24">الجرعة (Dosage)</th>
              <th className="p-2.5 text-center w-28">التكرار (Frequency)</th>
              <th className="p-2.5 text-center w-24">المدة (Duration)</th>
              <th className="p-2.5">تعليمات الاستخدام (Instructions)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {data.medications.map((med, idx) => (
              <tr key={idx} className="hover:bg-zinc-50/50">
                <td className="p-2.5 text-center font-mono text-zinc-500">{idx + 1}</td>
                <td className="p-2.5 font-bold text-zinc-950">
                  <div className="flex items-center gap-1.5">
                    <Pill className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{med.name}</span>
                  </div>
                </td>
                <td className="p-2.5 text-center font-mono">{med.dosage}</td>
                <td className="p-2.5 text-center font-medium">{med.frequency}</td>
                <td className="p-2.5 text-center font-medium">{med.duration}</td>
                <td className="p-2.5 text-zinc-700">{med.instructions || 'حسب إرشادات الطبيب والصيدلي'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="rounded-lg border border-zinc-200 p-3 bg-zinc-50 mb-8 text-[11px]">
          <strong className="text-zinc-700 block mb-0.5">إرشادات عامة للمريض:</strong>
          <p className="text-zinc-600">{data.notes}</p>
        </div>
      )}

      {/* Signatures & Stamps */}
      <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs">
        <div className="border-t border-dashed border-zinc-400 pt-3">
          <span className="block font-bold mb-1">توقيع وترخيص الطبيب المعالج</span>
          <span className="text-zinc-400 text-[10px]">التوقيع: ................................</span>
        </div>
        <div className="border-t border-dashed border-zinc-400 pt-3">
          <span className="block font-bold mb-1">ختم المركز الطبي المعتمد</span>
          <span className="text-zinc-400 text-[10px]">الختم الرسمي</span>
        </div>
      </div>
    </div>
  );
};
