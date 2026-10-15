import React, { useState } from 'react';
import type { MedicalHistory, Allergy, AllergySeverity } from '@shared/contracts';
import {
  MEDICAL_CONDITION_KEYS,
  MEDICAL_CONDITION_KEY_AR,
  ALLERGY_SEVERITIES,
  ALLERGY_SEVERITY_AR,
} from '@shared/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  HeartPulse,
  AlertTriangle,
  Plus,
  Trash2,
  ShieldAlert,
} from 'lucide-react';

export interface PatientMedicalHistoryTabProps {
  patientId: string;
  medicalHistory: MedicalHistory[];
  allergies: Allergy[];
  onSaveHistory: (conditionKey: string, hasCondition: boolean, details?: string) => void;
  onAddAllergy: (allergy: {
    allergen: string;
    severity: AllergySeverity;
    reaction: string | null;
    type?: any;
  }) => void;
  onDeleteAllergy: (id: string) => void;
}

export const PatientMedicalHistoryTab: React.FC<PatientMedicalHistoryTabProps> = ({
  patientId: _patientId,
  medicalHistory,
  allergies,
  onSaveHistory,
  onAddAllergy,
  onDeleteAllergy,
}) => {
  const [isAddAllergyOpen, setIsAddAllergyOpen] = useState(false);
  const [newAllergen, setNewAllergen] = useState('');
  const [newSeverity, setNewSeverity] = useState<AllergySeverity>('moderate');
  const [newNotes, setNewNotes] = useState('');

  const handleCreateAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllergen.trim()) return;

    onAddAllergy({
      allergen: newAllergen.trim(),
      severity: newSeverity,
      reaction: newNotes.trim() || null,
    });

    setNewAllergen('');
    setNewSeverity('moderate');
    setNewNotes('');
    setIsAddAllergyOpen(false);
  };

  return (
    <div id="patient-medical-history-tab" className="space-y-6">
      {/* Allergies Banner & List */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                حساسية المريض (Allergies)
              </h3>
              <p className="text-xs text-slate-500">
                سجل الحساسيات الدوائية والغذائية وخامات طب الأسنان (تحذير سريري أحمر)
              </p>
            </div>
          </div>

          <Button
            variant="danger"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddAllergyOpen(true)}
            className="text-xs"
          >
            إضافة حساسية جديدة
          </Button>
        </div>

        {allergies.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 text-center space-y-1">
            <p className="text-xs font-bold text-emerald-800">
              لا توجد أي حساسية مسجلة للمريض حتى الآن
            </p>
            <p className="text-[11px] text-emerald-600">
              المريض لم يبلغ عن تحسس من البنسلين ومشتقاته أو المخدر الموضعي أو اللاتكس
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allergies.map((allergy) => (
              <div
                key={allergy.id}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                  allergy.severity === 'severe'
                    ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                    : 'bg-amber-50/70 border-amber-300 text-amber-950'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle
                      className={`w-3.5 h-3.5 ${
                        allergy.severity === 'severe' ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    />
                    <span>{allergy.allergen}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <Badge
                      variant={allergy.severity === 'severe' ? 'danger' : 'warning'}
                      className="text-[9px] px-1.5 py-0"
                    >
                      {ALLERGY_SEVERITY_AR[allergy.severity] || allergy.severity}
                    </Badge>
                  </div>

                  {allergy.notes && (
                    <p className="text-[11px] opacity-80 mt-1">ملاحظات: {allergy.notes}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteAllergy(allergy.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Systemic Conditions Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-brand-navy" />
            الأمراض الجهازية والمزمنة (Systemic Conditions)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            تأكيد الحالة الصحية العامة للتحقق من سلامة الإجراءات الجراحية وإمكانية النزيف
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MEDICAL_CONDITION_KEYS.map((key) => {
            const existing = medicalHistory.find((m) => m.condition_key === key);
            const hasCondition = existing?.has_condition || false;

            return (
              <div
                key={key}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-colors ${
                  hasCondition
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50/50'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-slate-900 block">
                    {MEDICAL_CONDITION_KEY_AR[key] || key}
                  </span>
                  {existing?.details && (
                    <span className="text-[11px] text-slate-500 block">{existing.details}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSaveHistory(key, !hasCondition)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      hasCondition
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {hasCondition ? 'مصاب / نعم' : 'سليم / لا'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Allergy Modal */}
      {isAddAllergyOpen && (
        <Modal open={isAddAllergyOpen} onOpenChange={setIsAddAllergyOpen}>
          <div className="p-6 bg-white rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              تسجيل حساسية دوائية أو مادية جديدة
            </h3>

            <form onSubmit={handleCreateAllergy} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  اسم المادة / الدواء المسبب للحساسية *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: البنسلين (Penicillin)، اللاتكس، الأسبرين..."
                  value={newAllergen}
                  onChange={(e) => setNewAllergen(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-brand-navy outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">شدة التحسس</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as AllergySeverity)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-700 outline-none"
                >
                  {ALLERGY_SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {ALLERGY_SEVERITY_AR[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  رد الفعل السريري / الأعراض
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: طفح جلدي، ضيق تنفس، صدمة تحسسية..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-brand-navy outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsAddAllergyOpen(false)}
                  className="text-xs"
                >
                  إلغاء
                </Button>
                <Button variant="danger" size="sm" type="submit" className="text-xs">
                  حفظ التحذير السريري
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
