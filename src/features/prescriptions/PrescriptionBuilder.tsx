import React, { useState, useMemo } from 'react';
import type { Patient, User, Allergy, MedicalHistory } from '@shared/contracts';
import {
  DENTAL_DRUGS_DATABASE,
  checkDrugAllergyConflict,
  type DentalDrug,
  type AllergyConflictResult,
} from './dentalDrugsData';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  Pill,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  FileText,
  X,
  Lock,
} from 'lucide-react';

export interface PrescriptionItemInput {
  id: string;
  drug_name: string;
  dose: string;
  frequency: string;
  duration_days: number;
  instructions: string;
  category?: string;
  drugFamily?: string;
  conflict?: AllergyConflictResult;
}

export interface PrescriptionBuilderProps {
  patient: Patient;
  dentists: User[];
  defaultDentistId?: string;
  allergies?: Allergy[];
  medicalHistory?: MedicalHistory[];
  onSave: (prescription: {
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
  }) => void;
  onCancel?: () => void;
  className?: string;
}

export const PrescriptionBuilder: React.FC<PrescriptionBuilderProps> = ({
  patient,
  dentists,
  defaultDentistId,
  allergies = [],
  medicalHistory = [],
  onSave,
  onCancel,
  className = '',
}) => {
  // Selected dentist & notes
  const [selectedDentistId, setSelectedDentistId] = useState(
    defaultDentistId || patient.primary_dentist_id || dentists[0]?.id || ''
  );
  const [notes, setNotes] = useState('');

  // Items in the prescription
  const [items, setItems] = useState<PrescriptionItemInput[]>([
    {
      id: crypto.randomUUID(),
      drug_name: 'Amoxicillin 500mg',
      dose: '500 ملغ (كبسولة واحدة)',
      frequency: 'كل 8 ساعات (3 مرات يومياً)',
      duration_days: 7,
      instructions: 'يؤخذ بعد الأكل مع كوب ماء وفير. استكمل الكورس العلاجي كاملاً.',
      drugFamily: 'penicillin',
      conflict: checkDrugAllergyConflict(
        { name: 'Amoxicillin 500mg', drugFamily: 'penicillin' },
        allergies,
        medicalHistory
      ),
    },
  ]);

  // Drug catalog search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCustomDrugOpen, setIsCustomDrugOpen] = useState(false);

  // Custom drug fields
  const [customName, setCustomName] = useState('');
  const [customDose, setCustomDose] = useState('');
  const [customFrequency, setCustomFrequency] = useState('كل 8 ساعات');
  const [customDuration, setCustomDuration] = useState(5);
  const [customInstructions, setCustomInstructions] = useState('');

  // Mandatory Allergy Conflict Dialog State (Acceptance Criteria: prevents silent save)
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideAck, setOverrideAck] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState('');

  // Filtered drug database
  const filteredCatalog = useMemo(() => {
    let result = DENTAL_DRUGS_DATABASE;
    if (selectedCategory !== 'all') {
      result = result.filter((d) => d.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.nameAr.toLowerCase().includes(q) ||
          d.nameEn.toLowerCase().includes(q) ||
          d.genericName.toLowerCase().includes(q) ||
          d.categoryAr.toLowerCase().includes(q) ||
          d.tradeNames.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [searchQuery, selectedCategory]);

  // Patient registered allergies summary
  const patientAllergySummaries = useMemo(() => {
    const list: string[] = [];
    const hasPenicillinCondition = medicalHistory.some(
      (h) => h.condition_key === 'allergy_penicillin' && h.has_condition
    );
    if (hasPenicillinCondition) {
      list.push('حساسية البنسلين (التاريخ الطبي)');
    }
    allergies.forEach((a) => {
      list.push(`${a.allergen} (${a.severity === 'severe' ? 'شديدة' : a.severity === 'moderate' ? 'متوسطة' : 'طفيفة'})`);
    });
    return list;
  }, [allergies, medicalHistory]);

  // Check if any current item has an unresolved allergy conflict
  const activeConflicts = useMemo(() => {
    return items.filter((it) => it.conflict && it.conflict.hasConflict);
  }, [items]);

  // Add drug from catalog
  const handleAddFromCatalog = (drug: DentalDrug) => {
    const conflict = checkDrugAllergyConflict(
      { name: drug.nameAr, allergens: drug.allergens, drugFamily: drug.drugFamily },
      allergies,
      medicalHistory
    );

    const newItem: PrescriptionItemInput = {
      id: crypto.randomUUID(),
      drug_name: `${drug.nameEn} (${drug.nameAr})`,
      dose: drug.defaultDose,
      frequency: drug.defaultFrequency,
      duration_days: drug.defaultDurationDays,
      instructions: drug.defaultInstructions,
      category: drug.categoryAr,
      drugFamily: drug.drugFamily,
      conflict,
    };

    setItems((prev) => [...prev, newItem]);
  };

  // Add custom drug
  const handleAddCustomDrug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const conflict = checkDrugAllergyConflict(
      { name: customName },
      allergies,
      medicalHistory
    );

    const newItem: PrescriptionItemInput = {
      id: crypto.randomUUID(),
      drug_name: customName.trim(),
      dose: customDose.trim() || 'جرعة اعتيادية',
      frequency: customFrequency,
      duration_days: Number(customDuration) || 5,
      instructions: customInstructions.trim() || 'حسب إرشادات الطبيب',
      conflict,
    };

    setItems((prev) => [...prev, newItem]);
    setCustomName('');
    setCustomDose('');
    setCustomInstructions('');
    setIsCustomDrugOpen(false);
  };

  // Remove item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Update item field
  const handleUpdateItem = (id: string, field: keyof PrescriptionItemInput, value: unknown) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'drug_name') {
          updated.conflict = checkDrugAllergyConflict(
            { name: String(value), drugFamily: updated.drugFamily },
            allergies,
            medicalHistory
          );
        }
        return updated;
      })
    );
  };

  // Primary Save Action - Blocks silent save if allergy conflict exists!
  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('يرجى إضافة دواء واحد على الأقل للوصفة.');
      return;
    }

    // CRITICAL ACCEPTANCE CRITERIA:
    // "تحذير الحساسية يظهر قبل الحفظ ويمنع الحفظ الصامت"
    if (activeConflicts.length > 0 && !overrideAck) {
      // Prevent silent save! Open the mandatory confirmation alert modal.
      setIsOverrideModalOpen(true);
      return;
    }

    // Execute save
    executeSave();
  };

  const executeSave = () => {
    const dentist = dentists.find((d) => d.id === selectedDentistId);
    onSave({
      dentist_id: selectedDentistId,
      dentist_name: dentist?.full_name || 'طبيب الأسنان المعالج',
      notes: notes.trim(),
      items: items.map((it) => ({
        drug_name: it.drug_name,
        dose: it.dose,
        frequency: it.frequency,
        duration_days: it.duration_days,
        instructions: it.instructions,
      })),
      allergyOverrideJustification: activeConflicts.length > 0 ? overrideJustification : undefined,
    });
  };

  return (
    <div className={`space-y-6 ${className}`} id="prescription-builder">
      {/* Patient Allergy Alert Header if allergies exist */}
      {patientAllergySummaries.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold text-amber-900 block text-sm">
              الحساسيات المسجلة للمريض ({patient.first_name} {patient.family_name}):
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {patientAllergySummaries.map((summary, idx) => (
                <span
                  key={idx}
                  className="bg-amber-100 text-amber-900 font-semibold px-2.5 py-1 rounded-md text-[11px] border border-amber-300/80 inline-flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  {summary}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-amber-700 mt-2">
              يقوم النظام تلقائياً بفحص الأدوية المختارة لمنع أي تعارض تحسسي مهدد لسلامة المريض.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Catalog on left/right + Prescription Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Built-in Dental Drugs Database & Search */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-4 h-4 text-brand-blue" />
                دليل أدوية الأسنان الشائعة المدمج
              </h4>
              <span className="text-[11px] text-slate-400">
                {DENTAL_DRUGS_DATABASE.length} صنف مدمج
              </span>
            </div>

            {/* Instant Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث فوري (أموكسيسيلين، بروفين، دالاسين...)"
                className="w-full pr-9 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'antibiotic', label: 'مضادات حيوية' },
                { id: 'nsaid', label: 'مسكنات NSAID' },
                { id: 'analgesic', label: 'باراسيتامول' },
                { id: 'antiseptic', label: 'غسول فم' },
                { id: 'antifungal', label: 'فطريات' },
                { id: 'corticosteroid', label: 'كورتيزون' },
                { id: 'hemostatic', label: 'مرقئ نزف' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-brand-blue text-white font-medium shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Drugs List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredCatalog.map((drug) => {
                const conflictCheck = checkDrugAllergyConflict(
                  { name: drug.nameAr, allergens: drug.allergens, drugFamily: drug.drugFamily },
                  allergies,
                  medicalHistory
                );

                return (
                  <div
                    key={drug.id}
                    className={`p-3 rounded-lg border transition-all text-right ${
                      conflictCheck.hasConflict
                        ? 'border-red-300 bg-red-50/50 hover:bg-red-50'
                        : 'border-slate-200 bg-white hover:border-brand-blue/50 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">
                            {drug.nameAr}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {drug.nameEn}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {drug.categoryAr} · جرعة: {drug.defaultDose}
                        </div>

                        {/* Trade names */}
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                          الأسماء التجارية: {drug.tradeNames.join('، ')}
                        </div>

                        {/* Conflict badge if allergic */}
                        {conflictCheck.hasConflict && (
                          <div className="mt-1.5 text-[11px] font-bold text-red-600 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span>تعارض حرج: {conflictCheck.conflictingAllergen}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant={conflictCheck.hasConflict ? 'danger' : 'secondary'}
                        onClick={() => handleAddFromCatalog(drug)}
                        className="text-xs shrink-0 py-1 px-2.5 h-8"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        إضافة
                      </Button>
                    </div>
                  </div>
                );
              })}

              {filteredCatalog.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  لا توجد نتائج مطابقة لبحثك في دليل الأدوية.
                </div>
              )}
            </div>

            {/* Quick Button to open Custom Drug dialog */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">دواء غير مدرج في القائمة؟</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCustomDrugOpen(true)}
                className="text-xs gap-1 border-dashed"
              >
                <Plus className="w-3.5 h-3.5 text-brand-blue" />
                إضافة دواء مخصص
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Prescription Details & Active Items */}
        <div className="lg:col-span-7 space-y-4">
          {/* Top Form Controls: Dentist Selector & Notes */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الطبيب المعالج المصدر للوصفة
                </label>
                <select
                  value={selectedDentistId}
                  onChange={(e) => setSelectedDentistId(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:bg-white text-slate-800"
                >
                  {dentists.map((d) => (
                    <option key={d.id} value={d.id}>
                      د. {d.full_name} ({d.specialty || 'طبيب أسنان'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ملاحظات أو توجيهات إضافية للصيدلي / المريض
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: يرجى صرف البديل المماثل في حال عدم توفر الصنف..."
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:bg-white text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Active Allergy Conflict High-Priority Banner (If any item conflicts) */}
          {activeConflicts.length > 0 && (
            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 shadow-md text-red-900 space-y-3 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-600 text-white rounded-lg shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="flex-1 text-xs">
                  <h4 className="font-extrabold text-sm text-red-900 flex items-center gap-2">
                    تحذير طبي حرج: تعارض مع حساسيات المريض المسجلة!
                  </h4>
                  <p className="mt-1 text-red-800 leading-relaxed">
                    تحتوي الوصفة على أدوية تتعارض مباشرة مع حساسية المريض. تم تفعيل الحظر الإلزامي لمنع الحفظ الصامت وضمان سلامة المريض السريرية.
                  </p>
                  <div className="mt-2 space-y-1">
                    {activeConflicts.map((c, i) => (
                      <div
                        key={i}
                        className="bg-white/90 border border-red-300 rounded p-2 text-[11px] text-red-900 font-medium"
                      >
                        <span className="font-bold text-red-700">{c.drug_name}:</span> {c.conflict?.warningDetails}
                        <div className="text-emerald-700 font-bold mt-1">
                          💡 {c.conflict?.recommendedAlternative}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prescription Items List */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-navy" />
                أدوية الوصفة الحالية ({items.length})
              </h4>
              <span className="text-[11px] text-slate-500">
                يمكنك تعديل الجرعات والتعليمات مباشرة
              </span>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                <Pill className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">
                  لم يتم إضافة أي أدوية للوصفة حتى الآن. اختر من الدليل المدمج يميناً أو اضغط &quot;إضافة دواء مخصص&quot;.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((it, idx) => {
                  const hasConflict = it.conflict && it.conflict.hasConflict;

                  return (
                    <div
                      key={it.id}
                      className={`p-3 rounded-xl border transition-all ${
                        hasConflict
                          ? 'border-red-400 bg-red-50/60 ring-2 ring-red-300/40'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                      }`}
                    >
                      {/* Header with index, name, and delete */}
                      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200/60">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-5 h-5 rounded-full bg-brand-blue/10 text-brand-blue font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={it.drug_name}
                            onChange={(e) => handleUpdateItem(it.id, 'drug_name', e.target.value)}
                            className="font-bold text-xs text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-blue focus:outline-none flex-1"
                          />
                        </div>

                        {hasConflict && (
                          <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-red-600" />
                            تعارض حساسية
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1"
                          title="حذف الدواء"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Fields grid: Dose, Frequency, Duration */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">الجرعة</label>
                          <input
                            type="text"
                            value={it.dose}
                            onChange={(e) => handleUpdateItem(it.id, 'dose', e.target.value)}
                            className="w-full text-xs py-1 px-2 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">التكرار</label>
                          <input
                            type="text"
                            value={it.frequency}
                            onChange={(e) => handleUpdateItem(it.id, 'frequency', e.target.value)}
                            className="w-full text-xs py-1 px-2 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">المدة (بالأيام)</label>
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={it.duration_days}
                            onChange={(e) => handleUpdateItem(it.id, 'duration_days', Number(e.target.value))}
                            className="w-full text-xs py-1 px-2 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-blue font-mono"
                          />
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="mt-2 text-xs">
                        <label className="block text-[10px] text-slate-500 mb-0.5">
                          إرشادات الاستخدام للمريض
                        </label>
                        <input
                          type="text"
                          value={it.instructions}
                          onChange={(e) => handleUpdateItem(it.id, 'instructions', e.target.value)}
                          placeholder="مثلاً: يؤخذ بعد الطعام مباشرة مع كوب ماء كامل..."
                          className="w-full text-xs py-1 px-2 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        />
                      </div>

                      {/* Warning box if this item specifically conflicts */}
                      {hasConflict && (
                        <div className="mt-2.5 p-2 bg-red-100/80 border border-red-300 rounded-lg text-[11px] text-red-900 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-red-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            {it.conflict?.warningTitle}
                          </div>
                          <p className="text-red-700 leading-snug">{it.conflict?.warningDetails}</p>
                          <p className="text-emerald-700 font-semibold pt-1">
                            ✨ {it.conflict?.recommendedAlternative}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                إلغاء
              </Button>
            )}

            <div className="flex items-center gap-3 mr-auto">
              {activeConflicts.length > 0 && (
                <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  الحفظ المباشر معطّل لوجود تعارض تحسسي
                </span>
              )}

              <Button
                type="button"
                variant={activeConflicts.length > 0 ? 'danger' : 'primary'}
                size="md"
                onClick={handleSaveClick}
                className="gap-2 px-6"
              >
                {activeConflicts.length > 0 ? (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    مراجعة التعارض وحفظ الوصفة
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    حفظ وإصدار الوصفة
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Allergy Conflict Override Confirmation Modal */}
      {isOverrideModalOpen && (
        <Modal
          isOpen={isOverrideModalOpen}
          onClose={() => setIsOverrideModalOpen(false)}
          title="⚠️ تحذير طبي حرج: تأكيد تجاوز تعارض الحساسية"
          className="max-w-lg"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 text-red-900 space-y-2">
              <div className="font-extrabold text-sm text-red-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                تعارض دوائي إلزامي المراجعة قبل الحفظ
              </div>
              <p className="text-xs leading-relaxed text-red-800">
                تم رصد تعارض بين الأدوية الموصوفة وحساسية المريض المسجلة في السجل الصحي. معايير سلامة المرضى تمنع الحفظ الصامت وتتطلب إقراراً صريحاً ومبرراً طبياً من الطبيب المعالج.
              </p>

              <div className="space-y-2 pt-2 border-t border-red-200">
                {activeConflicts.map((c, i) => (
                  <div key={i} className="bg-white p-2.5 rounded border border-red-300">
                    <span className="font-bold text-red-800">{c.drug_name}:</span> {c.conflict?.warningDetails}
                    <div className="text-emerald-700 font-bold mt-1 text-[11px]">
                      {c.conflict?.recommendedAlternative}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Justification input */}
            <div>
              <label className="block font-bold text-slate-900 mb-1">
                المبرر الطبي السريري للتجاوز (إلزامي):
              </label>
              <textarea
                rows={2}
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
                placeholder="مثال: تم إجراء اختبار حساسية جلدي في المستشفى وتبين زوال التحسس، أو تم تعديل الجرعة تحت المراقبة..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-400 focus:outline-none"
              />
            </div>

            {/* Mandatory Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-red-200 bg-red-50/50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={overrideAck}
                onChange={(e) => setOverrideAck(e.target.checked)}
                className="mt-0.5 rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-bold text-red-900 text-xs leading-snug">
                أقرّ أنا الطبيب المعالج بالاطلاع على تعارض الحساسية الموضح أعلاه وتحمل المسؤولية الطبية السريرية الكاملة عن صرف هذا الدواء للمريض.
              </span>
            </label>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOverrideModalOpen(false)}
              >
                إلغاء واستبدال الدواء ببديل آمن
              </Button>

              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={!overrideAck || !overrideJustification.trim()}
                onClick={() => {
                  setIsOverrideModalOpen(false);
                  executeSave();
                }}
                className="gap-1.5 px-4"
              >
                <CheckCircle2 className="w-4 h-4" />
                تأكيد التجاوز وحفظ الوصفة
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Custom Drug Modal */}
      {isCustomDrugOpen && (
        <Modal
          isOpen={isCustomDrugOpen}
          onClose={() => setIsCustomDrugOpen(false)}
          title="إضافة دواء مخصص للوصفة"
          className="max-w-md"
        >
          <form onSubmit={handleAddCustomDrug} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم الدواء</label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="مثال: ديسفلون 500 ملغ..."
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الجرعة</label>
                <input
                  type="text"
                  value={customDose}
                  onChange={(e) => setCustomDose(e.target.value)}
                  placeholder="مثال: قرص واحد 500 ملغ"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المدة (أيام)</label>
                <input
                  type="number"
                  min={1}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">التكرار</label>
              <select
                value={customFrequency}
                onChange={(e) => setCustomFrequency(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue bg-white"
              >
                <option value="كل 6 ساعات (4 مرات يومياً)">كل 6 ساعات (4 مرات يومياً)</option>
                <option value="كل 8 ساعات (3 مرات يومياً)">كل 8 ساعات (3 مرات يومياً)</option>
                <option value="كل 12 ساعة (مرتين يومياً)">كل 12 ساعة (مرتين يومياً)</option>
                <option value="مرة واحدة يومياً">مرة واحدة يومياً</option>
                <option value="عند اللزوم فقط">عند اللزوم فقط</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">تعليمات الاستخدام</label>
              <input
                type="text"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="مثال: بعد الأكل مع كوب ماء..."
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCustomDrugOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" variant="primary" size="sm">
                إضافة للوصفة
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
