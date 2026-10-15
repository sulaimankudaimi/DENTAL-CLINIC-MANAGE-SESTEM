import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type {
  ImageType,
  ToothSurface,
  ToothCondition,
} from '@shared/contracts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import {
  Stethoscope,
  X,
  Syringe,
  Package,
  FileText,
  Camera,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Smile,
} from 'lucide-react';

export interface TreatmentExecutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName?: string;
  dentistId?: string;
  planItemId?: string | null;
  initialProcedureId?: string;
  initialToothNumber?: number | null;
  initialSurface?: ToothSurface | null;
  onSuccess?: () => void;
}

const ANESTHESIA_OPTIONS = [
  { value: 'infiltration', label: 'تخدير ارتشاحي موضعي (Local Infiltration)' },
  { value: 'nerve_block', label: 'تخدير كتلوي سني (Nerve Block)' },
  { value: 'topical', label: 'تخدير سطحي جل/بخاخ (Topical Gel/Spray)' },
  { value: 'nitrous_oxide', label: 'تخدير استنشاقي / غاز الضحك (Nitrous Oxide)' },
  { value: 'none', label: 'بدون تخدير (No Anesthesia)' },
];

const TOOTH_CONDITION_OPTIONS: Array<{ value: ToothCondition; label: string }> = [
  { value: 'filled', label: 'محشو سابقاً / حشوة دائمة (Filled)' },
  { value: 'root_canal', label: 'علاج عصب وجذور (Root Canal)' },
  { value: 'crown', label: 'تاج / تلبيسة خزفية (Crown)' },
  { value: 'missing', label: 'مفقود / مخلوع (Missing)' },
  { value: 'implant', label: 'زراعة سنية (Implant)' },
  { value: 'healthy', label: 'سليم تماماً (Healthy)' },
  { value: 'caries', label: 'نخر أو تسوس (Caries)' },
];

const CLINICAL_TEMPLATES = [
  'تم إجراء حشوة كمبوزيت طبقية بعد تنظيف التسوس كاملاً ووضع بطانة وقائية.',
  'تم فتح الحجرة اللبية واستئصال العصب وتوسيع القنوات وتطهيرها بمحلول الهيبوكلوريت.',
  'تم خلع السن بنجاح دون أي مضاعفات وإيقاف النزف وإعطاء تعليمات ما بعد الخلع.',
  'تم أخذ طبعة دقيقة للتركيبات وإرسالها للمختبر بعد تحضير السن ووضع تاج مؤقت.',
  'تمت إزالة الجير والتكلسات العميقة وتلميع وتنعيم أسطح الجذور بدقة.',
];

export const TreatmentExecutionDialog: React.FC<TreatmentExecutionDialogProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  dentistId,
  planItemId,
  initialProcedureId,
  initialToothNumber,
  initialSurface,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Form State
  const [selectedDentistId, setSelectedDentistId] = useState(dentistId || '');
  const [selectedProcedureId, setSelectedProcedureId] = useState(initialProcedureId || '');
  const [toothNumber, setToothNumber] = useState<number | ''>(initialToothNumber || '');
  const [surface, setSurface] = useState<ToothSurface | ''>(initialSurface || '');
  const [anesthesiaType, setAnesthesiaType] = useState('infiltration');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [newToothCondition, setNewToothCondition] = useState<ToothCondition>('filled');
  const [updateOdontogram, setUpdateOdontogram] = useState(true);

  // Materials from inventory
  const [materials, setMaterials] = useState<
    Array<{ item_id: string; name: string; quantity_used: number; unit: string }>
  >([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [materialQty, setMaterialQty] = useState(1);

  // Image attachment
  const [hasImage, setHasImage] = useState(false);
  const [imageTitle, setImageTitle] = useState('صورة سريرية بعد العلاج');
  const [imageType, setImageType] = useState<ImageType>('intraoral_photo');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Dentists
  const { data: dentists = [] } = useQuery({
    queryKey: ['staff', 'dentists'],
    queryFn: async () => {
      const res = await api.staff.list({ role: 'dentist' });
      return res.ok ? res.data.items : [];
    },
  });

  // Fetch Procedures
  const { data: procedures = [] } = useQuery({
    queryKey: queryKeys.treatments.procedures(),
    queryFn: async () => {
      const res = await api.treatments.getProcedures({ page: 1, limit: 150 });
      return res.ok ? res.data.items : [];
    },
  });

  // Fetch Inventory items
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory', 'list'],
    queryFn: async () => {
      const res = await api.inventory.list({ page: 1, limit: 100 });
      return res.ok ? res.data.items : [];
    },
  });

  // Initialize values when opened
  useEffect(() => {
    if (isOpen) {
      if (dentists.length > 0 && !selectedDentistId) {
        setSelectedDentistId(dentistId || (dentists[0] as any).id);
      }
      if (initialProcedureId) {
        setSelectedProcedureId(initialProcedureId);
        const p = procedures.find((x) => x.id === initialProcedureId);
        if (p) setDurationMinutes(p.default_duration_min);
      } else if (procedures.length > 0 && !selectedProcedureId) {
        setSelectedProcedureId(procedures[0].id);
        setDurationMinutes(procedures[0].default_duration_min);
      }
      if (initialToothNumber) setToothNumber(initialToothNumber);
      if (initialSurface) setSurface(initialSurface);
    }
  }, [isOpen, initialProcedureId, initialToothNumber, initialSurface, dentists, procedures]);

  const selectedProcedure = procedures.find((p) => p.id === selectedProcedureId);

  const handleProcedureChange = (procId: string) => {
    setSelectedProcedureId(procId);
    const proc = procedures.find((p) => p.id === procId);
    if (proc) {
      setDurationMinutes(proc.default_duration_min);
      // Auto-suggest tooth condition based on category
      if (proc.category === 'endodontics') setNewToothCondition('root_canal');
      else if (proc.category === 'restorative') setNewToothCondition('filled');
      else if (proc.category === 'prosthodontics') setNewToothCondition('crown');
      else if (proc.category === 'oral_surgery') setNewToothCondition('missing');
      else if (proc.category === 'implantology') setNewToothCondition('implant');
    }
  };

  const handleAddMaterial = () => {
    if (!selectedMaterialId) return;
    const inv = inventoryItems.find((i) => i.id === selectedMaterialId);
    if (!inv) return;

    if (materials.some((m) => m.item_id === inv.id)) {
      setMaterials((prev) =>
        prev.map((m) =>
          m.item_id === inv.id ? { ...m, quantity_used: m.quantity_used + materialQty } : m
        )
      );
    } else {
      setMaterials((prev) => [
        ...prev,
        { item_id: inv.id, name: inv.name, quantity_used: materialQty, unit: inv.unit || 'قطعة' },
      ]);
    }
    setSelectedMaterialId('');
    setMaterialQty(1);
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.item_id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProcedureId) {
      setErrorMsg('يرجى اختيار الإجراء السريري');
      return;
    }
    if (!selectedDentistId) {
      setErrorMsg('يرجى تحديد الطبيب المعالج');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        patientId,
        dentistId: selectedDentistId,
        procedureId: selectedProcedureId,
        toothNumber: toothNumber !== '' ? Number(toothNumber) : null,
        surface: (surface as ToothSurface) || null,
        anesthesiaType,
        durationMinutes,
        priceHalalas: selectedProcedure ? selectedProcedure.default_price_halalas : 15000,
        planItemId: planItemId || null,
        clinicalNotes: clinicalNotes.trim() || undefined,
        materialsUsed: materials,
        newToothCondition: updateOdontogram && toothNumber !== '' ? newToothCondition : undefined,
        image: hasImage
          ? {
              title: imageTitle,
              image_type: imageType,
              file_path: `/storage/images/treatment_${Date.now()}.jpg`,
            }
          : undefined,
      };

      if (api.treatments.executeTreatmentTransaction) {
        const res = await api.treatments.executeTreatmentTransaction(payload);
        if (!res.ok) throw new Error(typeof res.error === 'string' ? res.error : (res.error as any)?.message || 'فشل تنفيذ الإجراء');
      } else {
        await api.treatments.create({
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          patient_id: patientId,
          procedure_id: selectedProcedureId,
          dentist_id: selectedDentistId,
          tooth_number: toothNumber !== '' ? Number(toothNumber) : null,
          surface: (surface as ToothSurface) || null,
          performed_at: new Date().toISOString(),
          status: 'completed',
          anesthesia_type: anesthesiaType,
          appointment_id: null,
          plan_item_id: planItemId || null,
          clinical_notes: clinicalNotes.trim() || null,
          price_halalas: selectedProcedure ? selectedProcedure.default_price_halalas : 15000,
          materials_used: materials,
        });
      }

      // Invalidate queries to update views
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments.list({ patient_id: patientId }) });
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments.plans(patientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.toothRecords.byPatient(patientId) });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'list'] });

      showToast({
        title: 'تم تنفيذ وتسجيل الإجراء',
        description: 'تم توثيق العلاج، تحديث مخطط الأسنان، وخصم المواد من المستودع بنجاح.',
        variant: 'success',
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الإجراء السريري');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-navy flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5 text-[#1E4E9C]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                تسجيل وتنفيذ إجراء علاجي سريري
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                المريض: <span className="font-semibold text-slate-800">{patientName || 'المريض الحالي'}</span> — توثيق الجلسة، التخدير، وخصم المواد
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-right">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Procedure & Dentist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الإجراء السريري المطبق <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedProcedureId}
                onChange={(e) => handleProcedureChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#1E4E9C]/20"
                required
              >
                <option value="">-- اختر الإجراء من الكتالوج --</option>
                {procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name_ar} ({(p.default_price_halalas / 100).toLocaleString('en-US')} ر.س)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الطبيب المعالج المنفذ للجلسة <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedDentistId}
                onChange={(e) => setSelectedDentistId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#1E4E9C]/20"
                required
              >
                <option value="">-- اختر الطبيب المعالج --</option>
                {dentists.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    د. {d.full_name || d.name} ({d.specialty || 'طبيب أسنان'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tooth & Surface & Duration */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                رقم السن (FDI):
              </label>
              <Input
                type="number"
                min={11}
                max={85}
                value={toothNumber}
                onChange={(e) => setToothNumber(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="مثال: 16"
                className="text-xs font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                أسطح السن المعالجة:
              </label>
              <Input
                value={surface}
                onChange={(e) => setSurface(e.target.value.toUpperCase() as ToothSurface)}
                placeholder="MOD / O / B / M"
                className="text-xs font-mono uppercase text-center"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                مدة الجلسة (بالدقائق):
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min={5}
                  step={5}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="text-xs font-bold pl-8 text-center"
                />
                <span className="absolute left-2.5 top-2.5 text-[10px] text-slate-400">د</span>
              </div>
            </div>
          </div>

          {/* Anesthesia Section */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Syringe className="w-3.5 h-3.5 text-blue-600" />
              نوع التخدير المستخدم في الجلسة
            </label>
            <select
              value={anesthesiaType}
              onChange={(e) => setAnesthesiaType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4E9C]/20"
            >
              {ANESTHESIA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Materials Used Connected to Inventory */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-600" />
                المواد السريرية المستخدمة (تُخصم من المخزون آلياً)
              </label>
              <span className="text-[11px] text-slate-400">صرف مباشر من المستودع</span>
            </div>

            {/* Selector row */}
            <div className="flex items-center gap-2">
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4E9C]/20"
              >
                <option value="">-- اختر مادة من مخزون العيادة --</option>
                {inventoryItems.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} (المتوفر: {inv.quantity} {inv.unit})
                  </option>
                ))}
              </select>

              <div className="w-20">
                <Input
                  type="number"
                  min={1}
                  value={materialQty}
                  onChange={(e) => setMaterialQty(Math.max(1, Number(e.target.value)))}
                  className="text-xs text-center font-bold"
                  placeholder="الكمية"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMaterial}
                icon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                إضافة
              </Button>
            </div>

            {/* Materials List */}
            {materials.length > 0 ? (
              <div className="divide-y divide-slate-200/70 border border-slate-200 rounded-lg bg-white overflow-hidden">
                {materials.map((mat) => (
                  <div key={mat.item_id} className="p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                        {mat.quantity_used} {mat.unit}
                      </Badge>
                      <span className="font-semibold text-slate-800">{mat.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterial(mat.item_id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="حذف المادة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic text-center py-1">
                لم يتم إدراج مواد مستهلكة حتى الآن (اختياري)
              </p>
            )}
          </div>

          {/* Odontogram Status Integration */}
          {toothNumber !== '' && (
            <div className="p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={updateOdontogram}
                  onChange={(e) => setUpdateOdontogram(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1E4E9C] focus:ring-brand-blue"
                />
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-[#1E4E9C]" />
                  تحديث حالة السن #{toothNumber} في المخطط السريري (Odontogram) تلقائياً
                </span>
              </label>

              {updateOdontogram && (
                <div className="pt-1.5">
                  <label className="block text-[11px] text-slate-600 mb-1">
                    الحالة السريرية الجديدة للسن بعد انتهاء الجلسة:
                  </label>
                  <select
                    value={newToothCondition}
                    onChange={(e) => setNewToothCondition(e.target.value as ToothCondition)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4E9C]/20"
                  >
                    {TOOTH_CONDITION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        الحالة الجديدة: {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Clinical Notes & Quick Templates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                الملاحظات السريرية والتفاصيل الإجرائية
              </label>
              <span className="text-[11px] text-slate-400">قوالب سريعة:</span>
            </div>

            {/* Quick Template Chips */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {CLINICAL_TEMPLATES.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setClinicalNotes((prev) => (prev ? `${prev}\n${tpl}` : tpl))}
                  className="text-[10px] px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-[#1E4E9C] text-slate-600 border border-slate-200/80 transition-all text-right"
                >
                  + {tpl.slice(0, 30)}...
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="سجل خطوات العلاج، المواد المحددة، تجاوب المريض، وتوصيات الزيارة القادمة..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none resize-none"
            />
          </div>

          {/* Image Upload Toggle */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-600" />
                إرفاق صورة سريرية أو صورة أشعة للجلسة
              </span>
              <input
                type="checkbox"
                checked={hasImage}
                onChange={(e) => setHasImage(e.target.checked)}
                className="w-4 h-4 rounded text-brand-navy"
              />
            </label>

            {hasImage && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    عنوان الصورة:
                  </label>
                  <Input
                    value={imageTitle}
                    onChange={(e) => setImageTitle(e.target.value)}
                    className="text-xs"
                    placeholder="مثال: أشعة ذروية بعد إنهاء العصب"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    نوع الصورة:
                  </label>
                  <select
                    value={imageType}
                    onChange={(e) => setImageType(e.target.value as ImageType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4E9C]/20"
                  >
                    <option value="periapical">أشعة ذروية (Periapical)</option>
                    <option value="panoramic">بانوراما فكية (OPG)</option>
                    <option value="bitewing">أشعة مجنحة (Bitewing)</option>
                    <option value="intraoral">صورة فوتوغرافية داخل الفم</option>
                    <option value="extraoral">صورة فوتوغرافية خارج الفم / وجهية</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<CheckCircle2 className="w-4 h-4" />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'جاري توثيق الجلسة والخصم...' : 'اعتماد وتنفيذ الإجراء'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TreatmentExecutionDialog;
