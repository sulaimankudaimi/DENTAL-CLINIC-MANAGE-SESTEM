import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/formatters';
import type {
  TreatmentPlan,
  TreatmentPlanItem,
  Procedure,
  Patient,
  ToothSurface,
  CreateTreatmentPlan,
} from '@shared/contracts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { PatientPresentationModal } from './components/PatientPresentationModal';
import { AcceptPlanDialog } from './components/AcceptPlanDialog';
import { TreatmentExecutionDialog } from '../treatments/TreatmentExecutionDialog';
import {
  Save,
  Printer,
  CheckCircle2,
  Plus,
  Trash2,
  Stethoscope,
  MoveUp,
  MoveDown,
  Layers,
  ArrowRight,
  Search,
  ShieldCheck,
  PlayCircle,
  X,
} from 'lucide-react';

export interface PlanItemDraft {
  tempId: string;
  procedure_id: string;
  tooth_number: number | null;
  surface: ToothSurface | null;
  quantity: number;
  unit_price_halalas: number;
  discount_mode: 'fixed' | 'percent';
  discount_value: number; // in SAR or percent
  discount_halalas: number;
  priority: 1 | 2 | 3; // 1: urgent, 2: recommended, 3: optional
  phase: number;
  status: 'planned' | 'completed' | 'existing';
}

export interface TreatmentPlanBuilderProps {
  patient: Patient;
  existingPlan?: (TreatmentPlan & { items?: TreatmentPlanItem[] }) | null;
  onBack?: () => void;
  onPlanSaved?: (plan: TreatmentPlan) => void;
}

const DEFAULT_PHASES = [
  { phase: 1, title: 'المرحلة الأولى: تسكين الألم والسيطرة على العدوى (عاجل)' },
  { phase: 2, title: 'المرحلة الثانية: العلاج الترميمي واللبي وجذور الأسنان' },
  { phase: 3, title: 'المرحلة الثالثة: التركيبات والتأهيل التجميلي النهائي' },
];

const ADULT_TEETH_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const ADULT_TEETH_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export const TreatmentPlanBuilder: React.FC<TreatmentPlanBuilderProps> = ({
  patient,
  existingPlan,
  onBack,
  onPlanSaved,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Plan metadata
  const [title, setTitle] = useState(existingPlan?.title || 'خطة علاجية تأهيلية شاملة');
  const [dentistId, setDentistId] = useState(existingPlan?.dentist_id || '');
  const [notes, setNotes] = useState(existingPlan?.notes || '');
  const [insuranceCoveragePercent, setInsuranceCoveragePercent] = useState<number>(
    patient.insurance_policy_no ? 80 : 0
  );

  // Phases & Items
  const [phasesList, setPhasesList] = useState(DEFAULT_PHASES);
  const [items, setItems] = useState<PlanItemDraft[]>([]);

  // Modals
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [catalogTargetPhase, setCatalogTargetPhase] = useState(1);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory] = useState('all');

  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [executionItem, setExecutionItem] = useState<PlanItemDraft | null>(null);

  // Selected tooth on the quick bar
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  // Fetch Procedures
  const { data: procedures = [] } = useQuery({
    queryKey: queryKeys.treatments.procedures(),
    queryFn: async () => {
      const res = await api.treatments.getProcedures({ page: 1, limit: 150 });
      return res.ok ? res.data.items : [];
    },
  });

  // Fetch Dentists
  const { data: dentists = [] } = useQuery({
    queryKey: ['staff', 'dentists'],
    queryFn: async () => {
      const res = await api.staff.list({ role: 'dentist' });
      return res.ok ? res.data.items : [];
    },
  });

  // Fetch Tooth Records
  const { data: toothRecords = [] } = useQuery({
    queryKey: queryKeys.toothRecords.byPatient(patient.id),
    queryFn: async () => {
      const res = await api.toothRecords.getByPatient(patient.id);
      return res.ok ? res.data : [];
    },
  });

  // Initialize existing plan items
  useEffect(() => {
    if (existingPlan?.items && existingPlan.items.length > 0) {
      const mapped: PlanItemDraft[] = existingPlan.items.map((i) => {
        const discHalalas = i.discount_halalas || 0;
        return {
          tempId: i.id || crypto.randomUUID(),
          procedure_id: i.procedure_id,
          tooth_number: i.tooth_number ?? null,
          surface: i.surface ?? null,
          quantity: i.quantity || 1,
          unit_price_halalas: i.unit_price_halalas,
          discount_mode: 'fixed',
          discount_value: discHalalas / 100,
          discount_halalas: discHalalas,
          priority: (i.priority as 1 | 2 | 3) || 1,
          phase: i.phase || 1,
          status: i.status || 'planned',
        };
      });
      setItems(mapped);

      // Ensure phases exist
      const maxPhase = Math.max(...mapped.map((m) => m.phase), 3);
      if (maxPhase > phasesList.length) {
        const extra: typeof DEFAULT_PHASES = [];
        for (let p = phasesList.length + 1; p <= maxPhase; p++) {
          extra.push({ phase: p, title: `المرحلة ${p}` });
        }
        setPhasesList((prev) => [...prev, ...extra]);
      }
    } else if (dentists.length > 0 && !dentistId) {
      setDentistId(dentists[0].id);
    }
  }, [existingPlan, dentists]);

  // Financial Calculations
  const { subtotalHalalas, discountHalalas, netAfterDiscountHalalas, insuranceAmountHalalas, patientShareHalalas } =
    useMemo(() => {
      let subtotal = 0;
      let discount = 0;
      items.forEach((item) => {
        const gross = item.unit_price_halalas * (item.quantity || 1);
        subtotal += gross;
        discount += item.discount_halalas;
      });
      const net = Math.max(0, subtotal - discount);
      const insurance = Math.round(net * ((insuranceCoveragePercent || 0) / 100));
      const patientDue = Math.max(0, net - insurance);

      return {
        subtotalHalalas: subtotal,
        discountHalalas: discount,
        netAfterDiscountHalalas: net,
        insuranceAmountHalalas: insurance,
        patientShareHalalas: patientDue,
      };
    }, [items, insuranceCoveragePercent]);

  // Mutations
  const savePlanMutation = useMutation({
    mutationFn: async (planStatus: 'draft' | 'proposed' | 'accepted' = 'draft') => {
      const planPayload: CreateTreatmentPlan = {
        clinic_id: patient.clinic_id,
        patient_id: patient.id,
        dentist_id: dentistId || dentists[0]?.id || 'u1000000-0000-0000-0000-000000000001',
        title,
        status: planStatus,
        total_halalas: netAfterDiscountHalalas,
        discount_halalas: discountHalalas,
        patient_consent_at: null,
        notes: notes || null,
        items: items.map((i) => ({
          clinic_id: patient.clinic_id,
          procedure_id: i.procedure_id,
          tooth_number: i.tooth_number,
          surface: i.surface,
          quantity: i.quantity,
          unit_price_halalas: i.unit_price_halalas,
          discount_halalas: i.discount_halalas,
          priority: i.priority,
          phase: i.phase,
          status: i.status,
          scheduled_date: null,
        })),
      };

      if (existingPlan?.id) {
        const res = await api.treatments.updatePlan(existingPlan.id, planPayload);
        if (!res.ok) throw new Error(typeof res.error === 'string' ? res.error : (res.error as any)?.message || 'فشل تحديث الخطة');
        return res.data;
      } else {
        const res = await api.treatments.createPlan(planPayload);
        if (!res.ok) throw new Error(typeof res.error === 'string' ? res.error : (res.error as any)?.message || 'فشل حفظ الخطة');
        return res.data;
      }
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments.plans(patient.id) });
      showToast({
        title: 'تم الحفظ',
        description: 'تم حفظ الخطة العلاجية وبنودها بنجاح',
        variant: 'success',
      });
      if (onPlanSaved) onPlanSaved(saved);
    },
    onError: (err) => {
      showToast({
        title: 'خطأ',
        description: err instanceof Error ? err.message : 'فشل حفظ الخطة',
        variant: 'error',
      });
    },
  });

  // Adding Items
  const handleAddProcedure = (proc: Procedure, targetPhase: number = 1, targetTooth: number | null = null) => {
    const newItem: PlanItemDraft = {
      tempId: crypto.randomUUID(),
      procedure_id: proc.id,
      tooth_number: targetTooth ?? (proc.requires_tooth ? 16 : null),
      surface: proc.requires_surface ? 'O' : null,
      quantity: 1,
      unit_price_halalas: proc.default_price_halalas,
      discount_mode: 'fixed',
      discount_value: 0,
      discount_halalas: 0,
      priority: 2, // recommended
      phase: targetPhase,
      status: 'planned',
    };
    setItems((prev) => [...prev, newItem]);
    setIsCatalogPickerOpen(false);
  };

  const handleUpdateItem = (tempId: string, patch: Partial<PlanItemDraft>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.tempId !== tempId) return item;
        const updated = { ...item, ...patch };

        // Recalculate discount halalas
        if (patch.discount_mode !== undefined || patch.discount_value !== undefined || patch.unit_price_halalas !== undefined || patch.quantity !== undefined) {
          const lineGross = updated.unit_price_halalas * (updated.quantity || 1);
          if (updated.discount_mode === 'percent') {
            const pct = Math.min(100, Math.max(0, updated.discount_value));
            updated.discount_halalas = Math.round(lineGross * (pct / 100));
          } else {
            updated.discount_halalas = Math.min(lineGross, Math.round(updated.discount_value * 100));
          }
        }
        return updated;
      })
    );
  };

  const handleRemoveItem = (tempId: string) => {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  };

  const handleMovePhase = (tempId: string, direction: 'up' | 'down') => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.tempId !== tempId) return item;
        const currentPhase = item.phase;
        const nextPhase = direction === 'up' ? Math.max(1, currentPhase - 1) : Math.min(phasesList.length, currentPhase + 1);
        return { ...item, phase: nextPhase };
      })
    );
  };

  const handleAddPhase = () => {
    const nextNum = phasesList.length + 1;
    setPhasesList((prev) => [...prev, { phase: nextNum, title: `المرحلة ${nextNum}: متابعة واستكمال العلاج` }]);
  };

  // Filter procedures for catalog picker modal
  const filteredCatalogProcedures = useMemo(() => {
    return procedures.filter((p) => {
      if (!p.is_active) return false;
      if (catalogCategory !== 'all' && p.category !== catalogCategory) return false;
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase().trim();
        return (
          p.name_ar.toLowerCase().includes(q) ||
          p.name_en?.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [procedures, catalogCategory, catalogSearch]);

  const assignedDentist = dentists.find((d) => d.id === dentistId);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="العودة إلى قائمة الخطط"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-brand-navy flex items-center justify-center">
            <Layers className="w-6 h-6 text-[#1E4E9C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {existingPlan ? 'محرر ومصمم الخطة العلاجية' : 'إنشاء وتصميم خطة علاجية جديدة'}
              </h2>
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-[#1E4E9C] border-blue-200">
                {existingPlan ? existingPlan.status : 'مسودة'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              المريض: <strong className="text-slate-800">{[patient.first_name, patient.father_name, patient.family_name].filter(Boolean).join(' ') || patient.code}</strong> ({patient.code})
              {patient.insurance_policy_no && (
                <span className="mr-2 text-teal-700">
                  • وثيقة تأمين: {patient.insurance_policy_no}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPresentationOpen(true)}
            icon={<Printer className="w-4 h-4" />}
            className="text-xs"
            disabled={items.length === 0}
          >
            عرض على المريض (PDF)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => savePlanMutation.mutate('draft')}
            icon={<Save className="w-4 h-4" />}
            disabled={savePlanMutation.isPending}
            className="text-xs"
          >
            {savePlanMutation.isPending ? 'جاري الحفظ...' : 'حفظ كمسودة'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAcceptDialogOpen(true)}
            icon={<CheckCircle2 className="w-4 h-4" />}
            disabled={items.length === 0}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 shadow-sm"
          >
            قبول الخطة
          </Button>
        </div>
      </div>

      {/* Main Layout: Builder Content (Left/Center) + Live Financial Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Center: Phases & Items (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Plan Settings Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">عنوان الخطة العلاجية</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: خطة علاجية تأهيلية متكاملة"
                className="text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">الطبيب المعالج المسؤول</label>
              <select
                value={dentistId}
                onChange={(e) => setDentistId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4E9C]/20"
              >
                {dentists.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    د. {d.full_name || d.name} ({d.specialty || 'طبيب أسنان'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Odontogram Tooth Picker Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-[#1E4E9C]" />
                مخطط الأسنان السريع لاختيار السن مباشرة:
              </span>
              {selectedTooth && (
                <span className="text-xs text-brand-navy font-bold">
                  تم تحديد السن: #{selectedTooth}
                </span>
              )}
            </div>

            {/* Upper Teeth Row */}
            <div className="flex items-center justify-center gap-1 overflow-x-auto pb-1 text-[11px] font-mono">
              {ADULT_TEETH_UPPER.map((t) => {
                const rec = toothRecords.find((r) => r.tooth_number === t);
                const isSelected = selectedTooth === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setSelectedTooth(isSelected ? null : t);
                      if (!isSelected) {
                        setCatalogTargetPhase(1);
                        setIsCatalogPickerOpen(true);
                      }
                    }}
                    className={`w-7 h-7 rounded flex items-center justify-center font-bold border transition-all ${
                      isSelected
                        ? 'bg-brand-navy text-white border-brand-navy ring-2 ring-blue-300 scale-105'
                        : rec
                        ? 'bg-blue-50 text-[#1E4E9C] border-blue-200 hover:bg-blue-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title={`سن #${t} ${rec ? `(مسجل: ${rec.condition})` : ''}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            {/* Lower Teeth Row */}
            <div className="flex items-center justify-center gap-1 overflow-x-auto text-[11px] font-mono">
              {ADULT_TEETH_LOWER.map((t) => {
                const rec = toothRecords.find((r) => r.tooth_number === t);
                const isSelected = selectedTooth === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setSelectedTooth(isSelected ? null : t);
                      if (!isSelected) {
                        setCatalogTargetPhase(1);
                        setIsCatalogPickerOpen(true);
                      }
                    }}
                    className={`w-7 h-7 rounded flex items-center justify-center font-bold border transition-all ${
                      isSelected
                        ? 'bg-brand-navy text-white border-brand-navy ring-2 ring-blue-300 scale-105'
                        : rec
                        ? 'bg-blue-50 text-[#1E4E9C] border-blue-200 hover:bg-blue-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title={`سن #${t} ${rec ? `(مسجل: ${rec.condition})` : ''}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phased Lists */}
          <div className="space-y-4">
            {phasesList.map((phaseObj) => {
              const phaseItems = items.filter((i) => i.phase === phaseObj.phase);

              return (
                <div
                  key={phaseObj.phase}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* Phase Header */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-brand-navy flex items-center justify-center font-bold text-xs font-mono">
                        {phaseObj.phase}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900">{phaseObj.title}</h3>
                      <span className="text-[11px] text-slate-500">({phaseItems.length} إجراءات)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCatalogTargetPhase(phaseObj.phase);
                          setIsCatalogPickerOpen(true);
                        }}
                        icon={<Plus className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        إضافة إجراء للمرحلة
                      </Button>
                    </div>
                  </div>

                  {/* Phase Items Table */}
                  {phaseItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      لا توجد إجراءات مضافة في هذه المرحلة بعد. انقر "إضافة إجراء للمرحلة" للبدء.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right">
                        <thead className="bg-slate-50/50 text-slate-600 border-b border-slate-100 text-[11px]">
                          <tr>
                            <th className="p-2.5 pr-4">الإجراء</th>
                            <th className="p-2.5 text-center w-20">السن</th>
                            <th className="p-2.5 text-center w-20">السطح</th>
                            <th className="p-2.5 text-center w-16">الكمية</th>
                            <th className="p-2.5 text-center w-24">السعر (ر.س)</th>
                            <th className="p-2.5 text-center min-w-[130px]">الخصم</th>
                            <th className="p-2.5 text-center w-24">الأولوية</th>
                            <th className="p-2.5 text-center w-24">الصافي</th>
                            <th className="p-2.5 text-left pl-4 w-28">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {phaseItems.map((item) => {
                            const proc = procedures.find((p) => p.id === item.procedure_id);
                            const lineGross = item.unit_price_halalas * (item.quantity || 1);
                            const lineNet = Math.max(0, lineGross - item.discount_halalas);

                            return (
                              <tr key={item.tempId} className="hover:bg-slate-50/60 transition-colors">
                                {/* Procedure Name & Code */}
                                <td className="p-2.5 pr-4">
                                  <div className="font-bold text-slate-900 leading-tight">
                                    {proc ? proc.name_ar : 'إجراء علاجي'}
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {proc?.code}
                                  </span>
                                </td>

                                {/* Tooth # */}
                                <td className="p-2.5 text-center">
                                  <input
                                    type="number"
                                    min={11}
                                    max={85}
                                    value={item.tooth_number ?? ''}
                                    onChange={(e) =>
                                      handleUpdateItem(item.tempId, {
                                        tooth_number: e.target.value === '' ? null : Number(e.target.value),
                                      })
                                    }
                                    placeholder="عام"
                                    className="w-14 text-center font-mono font-bold text-xs p-1 rounded border border-slate-200 focus:border-brand-blue"
                                  />
                                </td>

                                {/* Surface */}
                                <td className="p-2.5 text-center">
                                  <input
                                    type="text"
                                    value={item.surface ?? ''}
                                    onChange={(e) =>
                                      handleUpdateItem(item.tempId, {
                                        surface: (e.target.value.toUpperCase() as ToothSurface) || null,
                                      })
                                    }
                                    placeholder="—"
                                    className="w-14 text-center font-mono text-xs p-1 rounded border border-slate-200 uppercase focus:border-brand-blue"
                                  />
                                </td>

                                {/* Quantity */}
                                <td className="p-2.5 text-center">
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleUpdateItem(item.tempId, {
                                        quantity: Math.max(1, Number(e.target.value)),
                                      })
                                    }
                                    className="w-12 text-center font-bold text-xs p-1 rounded border border-slate-200 focus:border-brand-blue"
                                  />
                                </td>

                                {/* Unit Price */}
                                <td className="p-2.5 text-center">
                                  <input
                                    type="number"
                                    min={0}
                                    step={10}
                                    value={Math.round(item.unit_price_halalas / 100)}
                                    onChange={(e) =>
                                      handleUpdateItem(item.tempId, {
                                        unit_price_halalas: Math.max(0, Number(e.target.value) * 100),
                                      })
                                    }
                                    className="w-18 text-center font-semibold text-xs p-1 rounded border border-slate-200 focus:border-brand-blue"
                                  />
                                </td>

                                {/* Discount (Amount or %) */}
                                <td className="p-2.5 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="number"
                                      min={0}
                                      value={item.discount_value}
                                      onChange={(e) =>
                                        handleUpdateItem(item.tempId, {
                                          discount_value: Math.max(0, Number(e.target.value)),
                                        })
                                      }
                                      className="w-14 text-center font-semibold text-xs p-1 rounded border border-slate-200"
                                      placeholder="0"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateItem(item.tempId, {
                                          discount_mode: item.discount_mode === 'fixed' ? 'percent' : 'fixed',
                                        })
                                      }
                                      className="px-1.5 py-1 text-[10px] font-bold rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                                      title={item.discount_mode === 'fixed' ? 'تحويل إلى نسبة مئوية %' : 'تحويل إلى مبلغ ثابت'}
                                    >
                                      {item.discount_mode === 'fixed' ? 'ر.س' : '%'}
                                    </button>
                                  </div>
                                </td>

                                {/* Priority */}
                                <td className="p-2.5 text-center">
                                  <select
                                    value={item.priority}
                                    onChange={(e) =>
                                      handleUpdateItem(item.tempId, {
                                        priority: Number(e.target.value) as 1 | 2 | 3,
                                      })
                                    }
                                    className={`text-[10px] font-bold px-1.5 py-1 rounded border ${
                                      item.priority === 1
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : item.priority === 2
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-blue-50 text-[#1E4E9C] border-blue-200'
                                    }`}
                                  >
                                    <option value={1}>عاجل</option>
                                    <option value={2}>موصى به</option>
                                    <option value={3}>اختياري</option>
                                  </select>
                                </td>

                                {/* Net Total */}
                                <td className="p-2.5 text-center font-bold text-slate-900">
                                  {formatCurrency(lineNet)}
                                </td>

                                {/* Actions */}
                                <td className="p-2.5 text-left pl-4">
                                  <div className="flex items-center gap-1 justify-end">
                                    {/* Execute clinical session button */}
                                    <button
                                      type="button"
                                      onClick={() => setExecutionItem(item)}
                                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                      title="تنفيذ وتوثيق هذا الإجراء سريرياً الآن"
                                    >
                                      <PlayCircle className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Move phase up */}
                                    {phaseObj.phase > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleMovePhase(item.tempId, 'up')}
                                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                                        title="نقل للمرحلة السابقة"
                                      >
                                        <MoveUp className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {/* Move phase down */}
                                    {phaseObj.phase < phasesList.length && (
                                      <button
                                        type="button"
                                        onClick={() => handleMovePhase(item.tempId, 'down')}
                                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                                        title="نقل للمرحلة التالية"
                                      >
                                        <MoveDown className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {/* Delete */}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(item.tempId)}
                                      className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                                      title="حذف البند"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Phase Button */}
            <div className="text-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPhase}
                icon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                إضافة مرحلة علاجية جديدة (المرحلة {phasesList.length + 1})
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Live Financial Summary Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-[#1E4E9C]" />
              شريط الملخص المالي الحيّ
            </h3>

            {/* Subtotals & Discounts */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>المجموع الإجمالي قبل الخصم:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatCurrency(subtotalHalalas)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>إجمالي الخصم الممنوح:</span>
                <span className="font-semibold text-rose-600 font-mono">
                  {discountHalalas > 0 ? `-${formatCurrency(discountHalalas)}` : '0.00 ر.س'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 font-semibold text-slate-800">
                <span>المجموع بعد الخصم:</span>
                <span className="font-mono">{formatCurrency(netAfterDiscountHalalas)}</span>
              </div>
            </div>

            {/* Insurance coverage slider/input */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">نسبة التغطية التأمينية المتوقعة:</span>
                <span className="font-bold text-[#1E4E9C] font-mono">
                  {insuranceCoveragePercent}%
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={insuranceCoveragePercent}
                onChange={(e) => setInsuranceCoveragePercent(Number(e.target.value))}
                className="w-full accent-brand-navy cursor-pointer"
              />

              <div className="flex items-center justify-between text-[11px] text-teal-800 font-medium pt-1">
                <span>حصة التأمين التقديرية:</span>
                <span className="font-mono font-bold">
                  {insuranceAmountHalalas > 0 ? `-${formatCurrency(insuranceAmountHalalas)}` : '0.00 ر.س'}
                </span>
              </div>
            </div>

            {/* Patient Net Due Prominent Banner */}
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl space-y-1 text-center">
              <span className="text-xs font-bold text-[#1E4E9C] block">
                صافي مستحق المريض (المطابق للفاتورة)
              </span>
              <span className="text-2xl font-black text-[#1E4E9C] font-mono block">
                {formatCurrency(patientShareHalalas)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                محسوبة بدقة حتى الهللة ومطابقة للفاتورة التقديرية
              </span>
            </div>

            {/* Doctor clinical notes */}
            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-700">ملاحظات الطبيب وتوصيات الخطة:</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="توصيات العناية بالفم، تسلسل الزيارات المقترح..."
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-brand-blue outline-none resize-none"
              />
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setIsAcceptDialogOpen(true)}
                icon={<CheckCircle2 className="w-4 h-4" />}
                disabled={items.length === 0}
                className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 font-bold"
              >
                قبول الخطة واعتمادها
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPresentationOpen(true)}
                icon={<Printer className="w-3.5 h-3.5" />}
                disabled={items.length === 0}
                className="w-full text-xs"
              >
                عرض على المريض (PDF)
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => savePlanMutation.mutate('draft')}
                icon={<Save className="w-3.5 h-3.5" />}
                disabled={savePlanMutation.isPending}
                className="w-full text-xs text-slate-600"
              >
                {savePlanMutation.isPending ? 'جاري الحفظ...' : 'حفظ كمسودة مؤقتة'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Procedure Picker Modal */}
      {isCatalogPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#1E4E9C]" />
                <h3 className="text-sm font-bold text-slate-900">
                  إضافة إجراء من الكتالوج إلى المرحلة {catalogTargetPhase}
                  {selectedTooth && <span className="mr-2 text-brand-navy">(سن #{selectedTooth})</span>}
                </h3>
              </div>
              <button
                onClick={() => setIsCatalogPickerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter in picker */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="ابحث بكود الإجراء أو الاسم بالعربية..."
                  className="w-full text-xs pr-9 pl-4 py-2 rounded-xl border border-slate-200 focus:border-brand-blue outline-none"
                />
              </div>
            </div>

            {/* Procedures list */}
            <div className="p-4 overflow-y-auto max-h-[400px] divide-y divide-slate-100">
              {filteredCatalogProcedures.map((proc) => (
                <div
                  key={proc.id}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-navy px-1.5 py-0.5 rounded bg-blue-50">
                        {proc.code}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{proc.name_ar}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {proc.name_en} • المدة: {proc.default_duration_min} دقيقة
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-800">
                      {(proc.default_price_halalas / 100).toLocaleString('en-US')} ر.س
                    </span>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddProcedure(proc, catalogTargetPhase, selectedTooth)}
                      className="text-xs py-1"
                    >
                      إضافة
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Patient Presentation PDF Modal */}
      {isPresentationOpen && (
        <PatientPresentationModal
          isOpen={isPresentationOpen}
          onClose={() => setIsPresentationOpen(false)}
          plan={{
            id: existingPlan?.id || 'draft-plan',
            clinic_id: patient.clinic_id,
            created_at: existingPlan?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
            patient_id: patient.id,
            dentist_id: dentistId || dentists[0]?.id || '',
            title,
            status: existingPlan?.status || 'draft',
            total_halalas: netAfterDiscountHalalas,
            discount_halalas: discountHalalas,
            patient_consent_at: null,
            notes,
          }}
          items={items.map((i) => ({
            id: i.tempId,
            clinic_id: patient.clinic_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
            plan_id: existingPlan?.id || 'draft-plan',
            procedure_id: i.procedure_id,
            tooth_number: i.tooth_number,
            surface: i.surface,
            quantity: i.quantity,
            unit_price_halalas: i.unit_price_halalas,
            discount_halalas: i.discount_halalas,
            priority: i.priority,
            phase: i.phase,
            status: i.status,
            scheduled_date: null,
          }))}
          procedures={procedures}
          patient={patient}
          dentist={assignedDentist}
          insuranceCoveragePercent={insuranceCoveragePercent}
        />
      )}

      {/* Accept Plan Atomic Dialog */}
      {isAcceptDialogOpen && (
        <AcceptPlanDialog
          isOpen={isAcceptDialogOpen}
          onClose={() => setIsAcceptDialogOpen(false)}
          onConfirm={async () => {
            // First ensure plan is saved
            const savedPlan = await savePlanMutation.mutateAsync('accepted');

            // Then execute atomic transaction
            if (api.treatments.acceptPlanTransaction) {
              const res = await api.treatments.acceptPlanTransaction({
                planId: savedPlan.id,
                patientId: patient.id,
                dentistId: dentistId || dentists[0]?.id || '',
                items: items.map((i) => ({
                  procedureId: i.procedure_id,
                  toothNumber: i.tooth_number,
                  surface: i.surface,
                  unitPriceHalalas: i.unit_price_halalas,
                  discountHalalas: i.discount_halalas,
                  quantity: i.quantity,
                  phase: i.phase,
                })),
              });
              if (!res.ok) throw new Error(typeof res.error === 'string' ? res.error : (res.error as any)?.message || 'فشل اعتماد الخطة');

              queryClient.invalidateQueries({ queryKey: queryKeys.treatments.plans(patient.id) });
              queryClient.invalidateQueries({ queryKey: queryKeys.treatments.list({ patient_id: patient.id }) });
              queryClient.invalidateQueries({ queryKey: queryKeys.toothRecords.byPatient(patient.id) });
              queryClient.invalidateQueries({ queryKey: queryKeys.invoices.list({ patient_id: patient.id }) });

              return res.data;
            }
            return null;
          }}
          plan={{
            id: existingPlan?.id || 'draft-plan',
            clinic_id: patient.clinic_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
            patient_id: patient.id,
            dentist_id: dentistId,
            title,
            status: 'accepted',
            total_halalas: netAfterDiscountHalalas,
            discount_halalas: discountHalalas,
            patient_consent_at: null,
            notes,
          }}
          items={items.map((i) => ({
            id: i.tempId,
            clinic_id: patient.clinic_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
            plan_id: existingPlan?.id || 'draft-plan',
            procedure_id: i.procedure_id,
            tooth_number: i.tooth_number,
            surface: i.surface,
            quantity: i.quantity,
            unit_price_halalas: i.unit_price_halalas,
            discount_halalas: i.discount_halalas,
            priority: i.priority,
            phase: i.phase,
            status: i.status,
            scheduled_date: null,
          }))}
          procedures={procedures}
          patient={patient}
          dentist={assignedDentist}
        />
      )}

      {/* Clinical Execution Dialog */}
      {executionItem && (
        <TreatmentExecutionDialog
          isOpen={true}
          onClose={() => setExecutionItem(null)}
          patientId={patient.id}
          patientName={[patient.first_name, patient.father_name, patient.family_name].filter(Boolean).join(' ') || patient.code}
          dentistId={dentistId}
          planItemId={executionItem.tempId}
          initialProcedureId={executionItem.procedure_id}
          initialToothNumber={executionItem.tooth_number}
          initialSurface={executionItem.surface}
          onSuccess={() => {
            // Update item status to completed
            handleUpdateItem(executionItem.tempId, { status: 'completed' });
          }}
        />
      )}
    </div>
  );
};
export default TreatmentPlanBuilder;
