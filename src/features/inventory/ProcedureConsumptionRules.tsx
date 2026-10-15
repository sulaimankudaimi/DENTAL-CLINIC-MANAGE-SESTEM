import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { PROCEDURE_MATERIAL_PRESETS } from './constants';
import type { InventoryItem } from '@shared/contracts';
import {
  Layers,
  Zap,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

interface ProcedureConsumptionRulesProps {
  inventoryItems: InventoryItem[];
}

export const ProcedureConsumptionRules: React.FC<ProcedureConsumptionRulesProps> = ({
  inventoryItems,
}) => {
  const queryClient = useQueryClient();
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [dentistName, setDentistName] = useState<string>('د. أحمد الشمري');
  const [isSuccessMessage, setIsSuccessMessage] = useState<string | null>(null);

  // Fetch patients for selector
  const { data: patients = [] } = useQuery({
    queryKey: queryKeys.patients.all,
    queryFn: async () => {
      const res = await api.patients.list({ page: 1, limit: 50 });
      return res.ok ? res.data.items : [];
    },
  });

  const activePreset = PROCEDURE_MATERIAL_PRESETS[selectedPresetIndex];

  // Mutation to deduct procedure materials
  const deductMutation = useMutation({
    mutationFn: async () => {
      if (!activePreset) return;
      const patient = patients.find((p) => p.id === selectedPatientId);
      const patientLabel = patient ? `${patient.first_name} ${patient.family_name}` : 'المريض';

      for (const mat of activePreset.defaultMaterials) {
        // Find matching item in inventory by SKU or Name
        const item = inventoryItems.find(
          (i) => i.sku === mat.matchSku || i.name.includes(mat.itemName.split(' ')[0])
        );

        if (item) {
          await api.inventory.recordTransaction({
            clinic_id: item.clinic_id,
            item_id: item.id,
            type: 'out',
            quantity: mat.quantity,
            reason: `صرف تلقائي لإجراء: ${activePreset.procedureName} - ${patientLabel} (${dentistName})`,
            treatment_id: null,
            created_by: 'u1000000-0000-0000-0000-000000000001',
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todaySummary });
      setIsSuccessMessage(
        `تم بنجاح صرف مستهلكات إجراء "${activePreset?.procedureName}" وخصم الكميات من المستودع تلقائياً!`
      );
      setTimeout(() => setIsSuccessMessage(null), 5000);
    },
  });

  return (
    <div className="space-y-6 text-xs">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-brand-navy/10 via-brand-navy/5 to-transparent border border-brand-navy/20 rounded-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-navy flex items-center justify-center text-white shrink-0 mt-0.5">
          <Zap className="w-5 h-5 text-amber-300" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 text-sm">
            محرك الربط التلقائي بين الإجراءات السريرية والمخزون
          </h3>
          <p className="text-slate-600 leading-relaxed">
            عند إتمام أي معالجة أو إجراء في العيادة، يقوم النظام تلقائياً بخصم المواد الطبية المرتبطة بها
            (مثل أمبولات البنج، ومواد الحشو، وأقماع الجذور، والخيوط الجراحية) وتوثيق حركة الصرف مع اسم
            المريض والطبيب المعالج بدقة دون الحاجة لإدخال يدوي منفصل.
          </p>
        </div>
      </div>

      {isSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{isSuccessMessage}</span>
        </div>
      )}

      {/* Two Column Grid: Rules List on the right, Direct Procedure Simulator on the left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Procedure Simulation / Immediate Execution (5/12) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-brand-navy" />
              <span>تسجيل صرف مباشر لإجراء سريري</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              اختر الإجراء المنفّذ والمريض لتطبيق الصرف التلقائي الفوري للمواد
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">الإجراء السريري المنفّذ *</label>
              <select
                value={selectedPresetIndex}
                onChange={(e) => setSelectedPresetIndex(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
              >
                {PROCEDURE_MATERIAL_PRESETS.map((preset, idx) => (
                  <option key={preset.procedureCode} value={idx}>
                    {preset.procedureName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">المريض المستفيد *</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
              >
                <option value="">-- اختر المريض المراجع --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.family_name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الطبيب المنفّذ *</label>
              <select
                value={dentistName}
                onChange={(e) => setDentistName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
              >
                <option value="د. أحمد الشمري">د. أحمد الشمري (استشاري جراحة وزراعة)</option>
                <option value="د. سارة المنصور">د. سارة المنصور (أخصائية علاج جذور وعصب)</option>
                <option value="د. فهد الدوسري">د. فهد الدوسري (طبيب أسنان عام)</option>
              </select>
            </div>

            {/* List of materials that will be deducted */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700 block text-[11px]">
                المواد الطبية المحددة للصرف الآلي ({activePreset?.defaultMaterials.length} أصناف):
              </span>
              <ul className="space-y-1.5 divide-y divide-slate-200/60">
                {activePreset?.defaultMaterials.map((mat, i) => {
                  const item = inventoryItems.find(
                    (item) => item.sku === mat.matchSku || item.name.includes(mat.itemName.split(' ')[0])
                  );
                  const isAvailable = item && item.quantity >= mat.quantity;

                  return (
                    <li key={i} className="pt-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-800 font-medium">{mat.itemName}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-brand-navy">
                          {mat.quantity} {mat.unit}
                        </span>
                        {isAvailable ? (
                          <span className="text-emerald-700 font-bold text-[10px]">متوفر</span>
                        ) : (
                          <span className="text-rose-600 font-bold text-[10px]">رصيد حرج</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full"
              icon={<Zap className="w-4 h-4" />}
              disabled={deductMutation.isPending || !selectedPatientId}
              onClick={() => deductMutation.mutate()}
            >
              {deductMutation.isPending ? 'جاري تنفيذ الصرف التلقائي...' : 'تنفيذ الصرف السريري للمخزون'}
            </Button>
          </div>
        </div>

        {/* Right: Automated Procedures Catalog (7/12) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm">
              قواعد استهلاك المواد المعتمدة في العيادة
            </h4>
            <span className="text-slate-500 text-[11px]">
              {PROCEDURE_MATERIAL_PRESETS.length} إجراءات مبرمجة للصرف الآلي
            </span>
          </div>

          <div className="space-y-3">
            {PROCEDURE_MATERIAL_PRESETS.map((preset) => (
              <div
                key={preset.procedureCode}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-brand-navy/40 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-navy/10 flex items-center justify-center text-brand-navy font-bold">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">{preset.procedureName}</h5>
                      <span className="text-[10px] text-slate-500 font-mono">
                        كود: {preset.procedureCode} · {preset.category}
                      </span>
                    </div>
                  </div>

                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    ربط آلي نشط
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  {preset.defaultMaterials.map((mat, mIdx) => (
                    <div
                      key={mIdx}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px]"
                    >
                      <span className="text-slate-700 font-medium truncate max-w-[170px]" title={mat.itemName}>
                        {mat.itemName}
                      </span>
                      <span className="font-mono font-bold text-slate-900 shrink-0">
                        {mat.quantity} {mat.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
