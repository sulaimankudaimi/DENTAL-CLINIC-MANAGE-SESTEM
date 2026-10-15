import React, { useState, useEffect } from 'react';
import type { Patient, User, Allergy, MedicalHistory } from '@shared/contracts';
import { api } from '@/lib/api';
import { formatDateAr } from '@/lib/formatters';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { PrescriptionBuilder } from '@/features/prescriptions/PrescriptionBuilder';
import {
  Pill,
  Plus,
  Printer,
  Trash2,
  QrCode,
  Calendar,
  User as UserIcon,
} from 'lucide-react';

export interface FullPrescriptionItem {
  id: string;
  prescription_id: string;
  drug_name: string;
  dose: string;
  frequency: string;
  duration_days: number;
  instructions: string | null;
}

export interface FullPrescription {
  id: string;
  patient_id: string;
  dentist_id: string;
  dentist_name: string;
  issued_at: string;
  notes: string | null;
  items?: FullPrescriptionItem[];
}

export interface PatientPrescriptionsTabProps {
  prescriptions?: FullPrescription[];
  patient: Patient;
  dentists: User[];
  allergies?: Allergy[];
  medicalHistory?: MedicalHistory[];
  onCreatePrescription?: (prescription: FullPrescription) => void;
}

export const PatientPrescriptionsTab: React.FC<PatientPrescriptionsTabProps> = ({
  prescriptions: initialPrescriptions = [],
  patient,
  dentists,
  allergies = [],
  medicalHistory = [],
}) => {
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<FullPrescription[]>(initialPrescriptions);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activePrescriptionForPrint, setActivePrescriptionForPrint] =
    useState<FullPrescription | null>(null);

  // Fetch prescriptions from api
  const loadPrescriptions = async () => {
    try {
      const res = await api.prescriptions.getByPatient(patient.id);
      if (res.ok && res.data) {
        setPrescriptions(res.data as FullPrescription[]);
      }
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, [patient.id]);

  const handleSavePrescription = async (data: {
    dentist_id: string;
    dentist_name: string;
    notes: string;
    items: Array<{
      drug_name: string;
      dose: string;
      frequency: string;
      duration_days: number;
      instructions: string;
    }>;
    allergyOverrideJustification?: string;
  }) => {
    try {
      const res = await api.prescriptions.create({
        clinic_id: patient.clinic_id,
        patient_id: patient.id,
        dentist_id: data.dentist_id,
        issued_at: new Date().toISOString(),
        notes: data.allergyOverrideJustification
          ? `${data.notes}\n[ملاحظة تجاوز الحساسية: ${data.allergyOverrideJustification}]`.trim()
          : data.notes || null,
        items: data.items,
      });

      if (res.ok) {
        toast({
          title: 'تم حفظ الوصفة الطبية بنجاح',
          description: `تم إصدار الوصفة وتحريرها مع ${data.items.length} صنف دوائي.`,
          variant: 'success',
        });
        setIsNewModalOpen(false);
        loadPrescriptions();
      } else {
        toast({
          title: 'خطأ في حفظ الوصفة',
          description: res.error,
          variant: 'error',
        });
      }
    } catch {
      toast({
        title: 'خطأ في الاتصال',
        description: 'تعذر حفظ الوصفة الطبية في قاعدة البيانات',
        variant: 'error',
      });
    }
  };

  const handleDeletePrescription = async (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في أرشفة هذه الوصفة الطبية؟')) return;
    try {
      const res = await api.prescriptions.delete(id);
      if (res.ok) {
        toast({
          title: 'تم حذف الوصفة',
          variant: 'default',
        });
        loadPrescriptions();
      }
    } catch {
      toast({
        title: 'خطأ أثناء الحذف',
        variant: 'error',
      });
    }
  };

  const handlePrint = (rx: FullPrescription) => {
    setActivePrescriptionForPrint(rx);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div id="patient-prescriptions-tab" className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-brand-navy" />
            الوصفات الدوائية والروشتات الطبية (Prescription Builder)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            إصدار وطباعة وصفات الأدوية مع فحص تعارض الحساسيات ودليل أدوية الأسنان المدمج
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsNewModalOpen(true)}
          className="text-xs gap-1.5"
        >
          <Plus className="w-4 h-4" />
          تحرير وصفة دوائية جديدة
        </Button>
      </div>

      {/* Prescriptions List */}
      {prescriptions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <Pill className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">لا توجد وصفات دوائية سابقة للمريض</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            يمكنك إنشاء وصفة علاجية جديدة للمريض مع فحص فوري للتعارضات الدوائية والجرعات القياسية.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="text-xs mt-2"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            إنشاء أول وصفة للمريض
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      وصفة علاجية #{rx.id.slice(0, 8)}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      معتمدة
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      د. {rx.dentist_name || 'طبيب العيادة'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateAr(rx.issued_at)}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrint(rx)}
                    className="text-xs gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    طباعة الروشتة (Rx)
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePrescription(rx.id)}
                    className="text-xs text-red-500 hover:text-red-700 p-1.5"
                    title="أرشفة الوصفة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/50">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">الدواء والمادة الفعالة</th>
                      <th className="py-2.5 px-3">الجرعة</th>
                      <th className="py-2.5 px-3">التكرار</th>
                      <th className="py-2.5 px-3">المدة</th>
                      <th className="py-2.5 px-3">إرشادات الاستخدام</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rx.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{item.drug_name}</td>
                        <td className="py-2.5 px-3 text-slate-700">{item.dose}</td>
                        <td className="py-2.5 px-3 text-slate-700">{item.frequency}</td>
                        <td className="py-2.5 px-3 text-slate-700">{item.duration_days} أيام</td>
                        <td className="py-2.5 px-3 text-slate-500">{item.instructions || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rx.notes && (
                <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold">توجيهات وملاحظات: </span>
                  {rx.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Prescription Builder Modal */}
      {isNewModalOpen && (
        <Modal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          title="تحرير وصفة دوائية جديدة (Prescription Builder)"
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <PrescriptionBuilder
            patient={patient}
            dentists={dentists}
            allergies={allergies}
            medicalHistory={medicalHistory}
            onSave={handleSavePrescription}
            onCancel={() => setIsNewModalOpen(false)}
          />
        </Modal>
      )}

      {/* Official Print Prescription View (Visible only during window.print()) */}
      {activePrescriptionForPrint && (
        <div className="hidden print:block fixed inset-0 bg-white p-10 z-50 text-slate-900 font-sans">
          {/* Header */}
          <div className="border-b-2 border-brand-navy pb-4 mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-brand-navy">مجمع عيادتي لطب وزراعة الأسنان</h1>
              <p className="text-xs text-slate-600 mt-0.5">
                المملكة العربية السعودية · ترخيص وزارة الصحة: MED-2026-99014 · هاتف: 0114002233
              </p>
            </div>
            <div className="text-left font-serif text-4xl font-extrabold text-brand-navy tracking-wider">
              Rx
            </div>
          </div>

          {/* Patient and Doctor metadata */}
          <div className="grid grid-cols-2 gap-4 pb-4 mb-6 border-b text-xs">
            <div className="space-y-1">
              <p>
                <span className="font-bold text-slate-700">اسم المريض: </span>
                <span className="text-sm font-bold text-slate-900">
                  {patient.first_name} {patient.father_name ? `${patient.father_name} ` : ''}{patient.family_name}
                </span>
              </p>
              <p>
                <span className="font-bold text-slate-700">رقم الملف الطبي: </span>
                <span className="font-mono font-bold">{patient.code}</span>
              </p>
              <p>
                <span className="font-bold text-slate-700">الجنس / العمر: </span>
                {patient.gender === 'male' ? 'ذكر' : 'أنثى'} · {patient.birth_date ? `${new Date().getFullYear() - new Date(patient.birth_date).getFullYear()} سنة` : 'غير محدد'}
              </p>
            </div>

            <div className="text-left space-y-1">
              <p>
                <span className="font-bold text-slate-700">تاريخ التحرير: </span>
                {formatDateAr(activePrescriptionForPrint.issued_at)}
              </p>
              <p>
                <span className="font-bold text-slate-700">الطبيب المعالج: </span>
                د. {activePrescriptionForPrint.dentist_name}
              </p>
              <p>
                <span className="font-bold text-slate-700">رقم الوصفة: </span>
                <span className="font-mono">{activePrescriptionForPrint.id.slice(0, 8)}</span>
              </p>
            </div>
          </div>

          {/* Medications list */}
          <div className="space-y-4 py-4 min-h-[350px]">
            {activePrescriptionForPrint.items?.map((it, idx) => (
              <div key={idx} className="space-y-1 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-slate-900">
                    {idx + 1}. {it.drug_name}
                  </p>
                  <span className="text-xs font-mono font-bold text-slate-600">
                    لمدة {it.duration_days} أيام
                  </span>
                </div>
                <p className="text-xs text-slate-700 pr-4">
                  <span className="font-bold text-slate-900">Sig: </span>
                  {it.dose} — {it.frequency}
                </p>
                {it.instructions && (
                  <p className="text-[11px] text-slate-500 pr-4 italic">
                    ملاحظات: {it.instructions}
                  </p>
                )}
              </div>
            ))}
          </div>

          {activePrescriptionForPrint.notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs mb-6">
              <span className="font-bold">توجيهات الصيدلي / المريض: </span>
              {activePrescriptionForPrint.notes}
            </div>
          )}

          {/* Footer with QR Code & Signature */}
          <div className="border-t-2 border-slate-200 pt-6 mt-12 flex justify-between items-end text-xs">
            <div className="space-y-1 flex items-center gap-3">
              <div className="w-16 h-16 border border-slate-300 p-1 rounded bg-slate-50 flex items-center justify-center">
                <QrCode className="w-12 h-12 text-slate-700" />
              </div>
              <div>
                <p className="font-bold text-slate-700">وصفة طبية إلكترونية موثقة</p>
                <p className="text-[10px] text-slate-500">رمز التحقق: RX-{activePrescriptionForPrint.id.slice(0, 10)}</p>
                <p className="text-[10px] text-slate-400">صالحة لمدة 7 أيام من تاريخ الإصدار</p>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="font-bold text-slate-800">ختم المركز وتوقيع الطبيب</p>
              <div className="w-40 border-b border-dashed border-slate-400 h-10 flex items-end justify-center pb-1">
                <span className="text-[10px] text-slate-400">د. {activePrescriptionForPrint.dentist_name}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
