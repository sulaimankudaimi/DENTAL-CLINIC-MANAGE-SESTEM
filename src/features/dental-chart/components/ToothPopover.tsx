import React, { useState } from 'react';
import type { ToothInfo } from '../lib/teethData';
import type {
  ToothRecord,
  ToothCondition,
  ToothSurface,
  Procedure,
  ToothRecordStatus,
} from '@shared/contracts';
import {
  TOOTH_SURFACE_AR,
} from '@shared/contracts';
import { CONDITION_CONFIGS } from '../lib/conditionColors';
import {
  X,
  Sparkles,
  Activity,
  Trash2,
  ChevronDown,
  Check,
} from 'lucide-react';

export interface ToothPopoverProps {
  tooth: ToothInfo;
  surface: ToothSurface | null;
  records: ToothRecord[];
  procedures: Procedure[];
  position: { x: number; y: number };
  onClose: () => void;
  onSaveRecord: (data: {
    tooth_number: number;
    condition: ToothCondition;
    surface?: ToothSurface;
    status?: ToothRecordStatus;
    note?: string;
  }) => Promise<any>;
  onAddProcedureToPlan: (data: {
    tooth_number: number;
    procedure: Procedure;
    surface?: ToothSurface;
    condition?: ToothCondition;
    notes?: string;
  }) => Promise<any>;
}

export const ToothPopover: React.FC<ToothPopoverProps> = ({
  tooth,
  surface = 'whole',
  records,
  procedures,
  position,
  onClose,
  onSaveRecord,
  onAddProcedureToPlan,
}) => {
  // Current record for this tooth / surface
  const targetSurface = surface || 'whole';
  const currentRecord =
    records.find((r) => (r.surface || 'whole') === targetSurface) ||
    records.find((r) => r.surface === 'whole');

  const [selectedCondition, setSelectedCondition] = useState<ToothCondition>(
    currentRecord?.condition || 'healthy'
  );
  const [selectedSurface, setSelectedSurface] = useState<ToothSurface>(targetSurface);
  const [notes, setNotes] = useState<string>(currentRecord?.note || '');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [searchProcedure, setSearchProcedure] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available surfaces for this tooth
  const availableSurfaces = tooth.available_surfaces;

  // Filtered procedures
  const filteredProcedures = procedures.filter(
    (p) =>
      p.name_ar.includes(searchProcedure) ||
      (p.name_en && p.name_en.toLowerCase().includes(searchProcedure.toLowerCase())) ||
      p.code.toLowerCase().includes(searchProcedure.toLowerCase())
  );

  // Quick action: New Filling
  const handleQuickFilling = async () => {
    setIsSubmitting(true);
    try {
      // Find matching filling procedure or fallback
      const fillingProc = procedures.find(
        (p) => p.category === 'restorative' || p.name_ar.includes('حشو')
      ) || {
        id: 'proc-filling-composite',
        clinic_id: 'c1',
        code: 'RES-01',
        name_ar: 'حشوة كومبوزيت ضوئية',
        name_en: 'Composite Restoration',
        category: 'restorative',
        default_price_halalas: 25000,
        default_duration_min: 30,
        requires_tooth: true,
        requires_surface: true,
        is_active: true,
        color: '#2563C9',
        created_at: '',
        updated_at: '',
        deleted_at: null,
      };

      await onAddProcedureToPlan({
        tooth_number: tooth.fdi_number,
        procedure: fillingProc as Procedure,
        surface: selectedSurface,
        condition: 'filled',
        notes: notes || 'حشوة جديدة',
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick action: Root Canal (علاج عصب)
  const handleQuickRootCanal = async () => {
    setIsSubmitting(true);
    try {
      const endoProc = procedures.find(
        (p) => p.category === 'endodontics' || p.name_ar.includes('عصب')
      ) || {
        id: 'proc-endo-single',
        clinic_id: 'c1',
        code: 'ENDO-01',
        name_ar: 'علاج عصب وجذور (RCT)',
        name_en: 'Root Canal Treatment',
        category: 'endodontics',
        default_price_halalas: 65000,
        default_duration_min: 45,
        requires_tooth: true,
        requires_surface: false,
        is_active: true,
        color: '#DC2626',
        created_at: '',
        updated_at: '',
        deleted_at: null,
      };

      await onAddProcedureToPlan({
        tooth_number: tooth.fdi_number,
        procedure: endoProc as Procedure,
        surface: 'whole',
        condition: 'root_canal',
        notes: notes || 'علاج عصب وجذور',
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick action: Extraction (خلع)
  const handleQuickExtraction = async () => {
    setIsSubmitting(true);
    try {
      const extractProc = procedures.find(
        (p) => p.category === 'oral_surgery' || p.name_ar.includes('خلع')
      ) || {
        id: 'proc-extract-simple',
        clinic_id: 'c1',
        code: 'SURG-01',
        name_ar: 'خلع سن بسيط',
        name_en: 'Simple Tooth Extraction',
        category: 'oral_surgery',
        default_price_halalas: 20000,
        default_duration_min: 20,
        requires_tooth: true,
        requires_surface: false,
        is_active: true,
        color: '#EF4444',
        created_at: '',
        updated_at: '',
        deleted_at: null,
      };

      await onAddProcedureToPlan({
        tooth_number: tooth.fdi_number,
        procedure: extractProc as Procedure,
        surface: 'whole',
        condition: 'to_extract',
        notes: notes || 'مقرر خلعه',
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom procedure select from full list
  const handleSelectCustomProcedure = async (proc: Procedure) => {
    setIsSubmitting(true);
    try {
      await onAddProcedureToPlan({
        tooth_number: tooth.fdi_number,
        procedure: proc,
        surface: selectedSurface,
        notes: notes || proc.name_ar,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Condition Update (e.g. Existing healthy, caries, etc.)
  const handleSaveCondition = async (status: ToothRecordStatus = 'existing') => {
    setIsSubmitting(true);
    try {
      await onSaveRecord({
        tooth_number: tooth.fdi_number,
        condition: selectedCondition,
        surface: selectedSurface,
        status,
        note: notes,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const conditionConfig = CONDITION_CONFIGS[selectedCondition] || CONDITION_CONFIGS.healthy;

  return (
    <>
      {/* Backdrop for closing */}
      <div
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[0.5px]"
        onClick={onClose}
      />

      {/* Floating Popover Container */}
      <div
        style={{
          top: `${Math.max(10, Math.min(position.y - 20, window.innerHeight - 560))}px`,
          left: `${Math.max(10, Math.min(position.x + 25, window.innerWidth - 340))}px`,
        }}
        className="fixed z-50 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 animate-in fade-in zoom-in-95 duration-150 select-none overflow-hidden"
        id="tooth-action-popover"
      >
        {/* Header matching screenshot */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white font-mono font-bold text-sm">
              {tooth.fdi_number}
            </span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                السن #{tooth.fdi_number}
              </h4>
              <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                {tooth.name_ar}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 p-1 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
          {/* Surface & Current Status row */}
          <div className="flex items-center justify-between bg-slate-50 rounded-lg p-2.5 border border-slate-100">
            <div className="text-xs">
              <span className="text-slate-500 ml-1">الحالة:</span>
              <span className="font-bold" style={{ color: conditionConfig.stroke }}>
                {conditionConfig.label_ar}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500">السطح:</span>
              <select
                value={selectedSurface}
                onChange={(e) => setSelectedSurface(e.target.value as ToothSurface)}
                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-medium text-slate-700 text-xs focus:ring-1 focus:ring-blue-500"
              >
                {availableSurfaces.map((s) => (
                  <option key={s} value={s}>
                    {TOOTH_SURFACE_AR[s] || s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Action Vertical Buttons (Matching Uploaded Image) */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              إجراءات سريعة للخطة
            </div>

            {/* 1. New Filling (حشو جديد) - Blue */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleQuickFilling}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium text-xs transition-all shadow-xs active:scale-98 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>حشو جديد (Restoration)</span>
              </div>
              <span className="text-[10px] bg-blue-200/60 text-blue-800 px-1.5 py-0.5 rounded font-mono">
                +خطة
              </span>
            </button>

            {/* 2. Root Canal (علاج عصب) - Green/Emerald */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleQuickRootCanal}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium text-xs transition-all shadow-xs active:scale-98 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>علاج عصب (Root Canal)</span>
              </div>
              <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                +خطة
              </span>
            </button>

            {/* 3. Extraction (خلع) - Red/Rose */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleQuickExtraction}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium text-xs transition-all shadow-xs active:scale-98 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>خلع السن (Extraction)</span>
              </div>
              <span className="text-[10px] bg-rose-200/60 text-rose-800 px-1.5 py-0.5 rounded font-mono">
                +خطة
              </span>
            </button>

            {/* 4. More... (المزيد) Expandable Procedure Drawer */}
            <button
              type="button"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            >
              <span>المزيد من الإجراءات السريرية...</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Expandable Procedure Search List */}
            {isMoreOpen && (
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-2 animate-in fade-in duration-100">
                <input
                  type="text"
                  placeholder="ابحث عن إجراء..."
                  value={searchProcedure}
                  onChange={(e) => setSearchProcedure(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-hidden"
                />
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {filteredProcedures.slice(0, 8).map((proc) => (
                    <button
                      key={proc.id}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSelectCustomProcedure(proc)}
                      className="w-full text-right px-2 py-1.5 text-xs rounded hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 flex items-center justify-between group transition-colors"
                    >
                      <span className="font-medium text-slate-800">{proc.name_ar}</span>
                      <span className="text-[11px] text-slate-400 group-hover:text-blue-600 font-mono">
                        {(proc.default_price_halalas / 100).toFixed(0)} ر.س
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Direct Condition Update */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              تسجيل حالة الفحص الحالي
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  'healthy',
                  'caries',
                  'filled',
                  'crown',
                  'bridge',
                  'implant',
                  'missing',
                  'root_canal',
                  'fractured',
                  'veneer',
                ] as ToothCondition[]
              ).map((cond) => {
                const cfg = CONDITION_CONFIGS[cond];
                const isCurrent = selectedCondition === cond;
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setSelectedCondition(cond)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs text-right border transition-all
                      ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }
                    `}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                      style={{ backgroundColor: cfg.fill }}
                    />
                    <span className="truncate">{cfg.label_ar}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              ملاحظات إكلينيكية (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: نخر عميق على السطح الإطباقي..."
              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveCondition('existing')}
              className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>حفظ كفحص منجز</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveCondition('planned')}
              className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors disabled:opacity-50"
              title="حفظ كمقترح في الخطة العلاجية"
            >
              مخطط (خطة)
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
