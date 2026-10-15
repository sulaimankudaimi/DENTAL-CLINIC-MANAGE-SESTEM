import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateAr } from '@/lib/formatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { PrescriptionBuilder } from '@/features/prescriptions/PrescriptionBuilder';
import type { Patient, Prescription, PrescriptionItem, Allergy, MedicalHistory } from '@shared/contracts';
import {
  Pill,
  Plus,
  Search,
  Printer,
  ShieldCheck,
  Calendar,
  User as UserIcon,
  Trash2,
  QrCode,
  HeartPulse,
} from 'lucide-react';

interface PrescriptionWithDetails extends Prescription {
  dentist_name?: string;
  patient_name?: string;
  items: PrescriptionItem[];
}

export const PrescriptionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDentistFilter, setSelectedDentistFilter] = useState('all');
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [selectedPatientForNew, setSelectedPatientForNew] = useState<Patient | null>(null);
  const [activePrescriptionForPrint, setActivePrescriptionForPrint] =
    useState<PrescriptionWithDetails | null>(null);

  // 1. Fetch Prescriptions
  const { data: prescriptionsResult, isLoading: isRxLoading } = useQuery({
    queryKey: ['prescriptions', 'list'],
    queryFn: () => api.prescriptions.list({ limit: 100 }),
  });

  const prescriptions = (prescriptionsResult?.ok
    ? prescriptionsResult.data.items
    : []) as PrescriptionWithDetails[];

  // 2. Fetch Patients for builder selector
  const { data: patientsResult } = useQuery({
    queryKey: ['patients', 'all'],
    queryFn: () => api.patients.list({ limit: 200 }),
  });
  const patients = patientsResult?.ok ? patientsResult.data.items : [];

  // 3. Fetch Dentists
  const { data: staffResult } = useQuery({
    queryKey: ['staff', { role: 'dentist' }],
    queryFn: () => api.staff.list({ role: 'dentist', limit: 50 }),
  });
  const dentists = staffResult?.ok ? staffResult.data.items : [];

  // 4. Fetch allergies & medical history for the selected patient
  const { data: allergiesResult } = useQuery({
    queryKey: ['allergies', selectedPatientForNew?.id],
    queryFn: () => api.patients.getAllergies(selectedPatientForNew!.id),
    enabled: !!selectedPatientForNew?.id,
  });
  const allergies = (allergiesResult?.ok ? allergiesResult.data : []) as Allergy[];

  const { data: medHistoryResult } = useQuery({
    queryKey: ['medicalHistory', selectedPatientForNew?.id],
    queryFn: () => api.patients.getMedicalHistory(selectedPatientForNew!.id),
    enabled: !!selectedPatientForNew?.id,
  });
  const medicalHistory = (medHistoryResult?.ok ? medHistoryResult.data : []) as MedicalHistory[];

  // Filtered prescriptions list
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
      const matchesDentist =
        selectedDentistFilter === 'all' || rx.dentist_id === selectedDentistFilter;
      const q = searchQuery.toLowerCase().trim();
      const ptName = (rx.patient_name || '').toLowerCase();
      const drName = (rx.dentist_name || '').toLowerCase();
      const drugs = (rx.items || []).map((it) => it.drug_name.toLowerCase()).join(' ');
      const matchesSearch = !q || ptName.includes(q) || drName.includes(q) || drugs.includes(q);

      return matchesDentist && matchesSearch;
    });
  }, [prescriptions, selectedDentistFilter, searchQuery]);

  // Statistics
  const totalPrescriptions = prescriptions.length;
  const totalDrugsCount = prescriptions.reduce((acc, p) => acc + (p.items?.length || 0), 0);

  const handleSaveNewPrescription = async (data: {
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
    if (!selectedPatientForNew) return;
    try {
      const res = await api.prescriptions.create({
        clinic_id: selectedPatientForNew.clinic_id,
        patient_id: selectedPatientForNew.id,
        dentist_id: data.dentist_id,
        issued_at: new Date().toISOString(),
        notes: data.allergyOverrideJustification
          ? `${data.notes}\n[تجاوز تعارض الحساسية: ${data.allergyOverrideJustification}]`.trim()
          : data.notes || null,
        items: data.items,
      });

      if (res.ok) {
        toast({
          title: 'تم إصدار الوصفة الطبية بنجاح',
          description: `تم حفظ الوصفة وتحديث السجل الدوائي للمريض.`,
          variant: 'success',
        });
        setIsBuilderModalOpen(false);
        setSelectedPatientForNew(null);
        queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      } else {
        toast({
          title: 'خطأ أثناء الحفظ',
          description: res.error,
          variant: 'error',
        });
      }
    } catch {
      toast({
        title: 'خطأ غير متوقع',
        variant: 'error',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد أرشفة هذه الوصفة الطبية؟')) return;
    try {
      const res = await api.prescriptions.delete(id);
      if (res.ok) {
        toast({ title: 'تمت أرشفة الوصفة' });
        queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      }
    } catch {
      toast({ title: 'تعذر الحذف', variant: 'error' });
    }
  };

  const handlePrint = (rx: PrescriptionWithDetails) => {
    setActivePrescriptionForPrint(rx);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-6" id="prescriptions-page">
      <PageHeader
        title="الوصفات والروشتات الطبية"
        description="إصدار الوصفات العلاجية وفق متطلبات هيئة الغذاء والدواء مع الفحص التلقائي لتعارضات الحساسية والجرعات"
        actions={
          <Button
            variant="primary"
            onClick={() => {
              if (patients.length > 0) {
                setSelectedPatientForNew(patients[0]);
              }
              setIsBuilderModalOpen(true);
            }}
            className="text-xs gap-1.5"
          >
            <Plus className="w-4 h-4" />
            تحرير وصفة طبية جديدة
          </Button>
        }
      />

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalPrescriptions}</div>
            <div className="text-xs text-slate-500">إجمالي الوصفات المصدرة</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalDrugsCount}</div>
            <div className="text-xs text-slate-500">أصناف دوائية تم صرفها ومتابعتها</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">100%</div>
            <div className="text-xs text-slate-500">فحص تعارض الحساسية نشط ومفعّل</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم المريض، الطبيب، أو اسم الدواء..."
              className="w-full pr-9 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:bg-white text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <div className="w-48">
            <select
              value={selectedDentistFilter}
              onChange={(e) => setSelectedDentistFilter(e.target.value)}
              className="w-full text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 text-slate-800"
            >
              <option value="all">جميع الأطباء المعالجين</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  د. {d.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Prescriptions List */}
      {isRxLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Spinner size="lg" className="text-brand-blue mx-auto" />
          <p className="text-xs text-slate-400 mt-2">جاري تحميل سجل الوصفات الطبية...</p>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <Pill className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">لا توجد وصفات طبية مطابقة</h4>
          <p className="text-xs text-slate-400">
            يمكنك تحرير وصفة جديدة واختيار المريض المعالج من القائمة.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrescriptions.map((rx) => (
            <div
              key={rx.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      وصفة طبية #{rx.id.slice(0, 8)}
                    </span>
                    <span className="text-xs font-semibold text-brand-blue bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      المريض: {rx.patient_name || 'مريض مسجل'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-4">
                    <span className="inline-flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      د. {rx.dentist_name || 'طبيب المركز'}
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
                    onClick={() => handleDelete(rx.id)}
                    className="text-xs text-red-500 hover:text-red-700 p-1.5"
                    title="أرشفة"
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
                      <th className="py-2.5 px-3">اسم الدواء والمادة الفعالة</th>
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
                  <span className="font-bold">ملاحظات سريرية: </span>
                  {rx.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Prescription Builder Modal */}
      {isBuilderModalOpen && (
        <Modal
          isOpen={isBuilderModalOpen}
          onClose={() => setIsBuilderModalOpen(false)}
          title="تحرير وصفة طبية جديدة (Prescription Builder)"
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <div className="space-y-4">
            {/* Patient Selector if not already pre-locked */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                اختر المريض المراد تحرير الوصفة له:
              </label>
              <select
                value={selectedPatientForNew?.id || ''}
                onChange={(e) => {
                  const pt = patients.find((p) => p.id === e.target.value);
                  setSelectedPatientForNew(pt || null);
                }}
                className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.family_name} ({p.code}) — {p.phone}
                  </option>
                ))}
              </select>
            </div>

            {selectedPatientForNew && (
              <PrescriptionBuilder
                patient={selectedPatientForNew}
                dentists={dentists}
                allergies={allergies}
                medicalHistory={medicalHistory}
                onSave={handleSaveNewPrescription}
                onCancel={() => setIsBuilderModalOpen(false)}
              />
            )}
          </div>
        </Modal>
      )}

      {/* Official Print View */}
      {activePrescriptionForPrint && (
        <div className="hidden print:block fixed inset-0 bg-white p-10 z-50 text-slate-900 font-sans">
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

          <div className="grid grid-cols-2 gap-4 pb-4 mb-6 border-b text-xs">
            <div className="space-y-1">
              <p>
                <span className="font-bold text-slate-700">اسم المريض: </span>
                <span className="text-sm font-bold text-slate-900">
                  {activePrescriptionForPrint.patient_name || 'المريض'}
                </span>
              </p>
              <p>
                <span className="font-bold text-slate-700">رقم الوصفة: </span>
                <span className="font-mono">{activePrescriptionForPrint.id.slice(0, 10)}</span>
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
            </div>
          </div>

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
              <span className="font-bold">توجيهات الصيدلي: </span>
              {activePrescriptionForPrint.notes}
            </div>
          )}

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

export default PrescriptionsPage;
