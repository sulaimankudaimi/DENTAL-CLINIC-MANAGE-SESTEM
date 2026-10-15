import React, { useState } from 'react';
import { ToothRecord, ToothCondition, ToothSurface } from '@shared/contracts';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Check } from 'lucide-react';

export interface OdontogramProps {
  records?: ToothRecord[];
  selectedTooth?: number | null;
  onSelectTooth?: (toothNumber: number) => void;
  onUpdateToothCondition?: (toothNumber: number, condition: ToothCondition, surfaces?: ToothSurface[]) => void;
  readOnly?: boolean;
}

// FDI Notation definition
// Maxillary (Upper): 18-11 (Upper Right) | 21-28 (Upper Left)
// Mandibular (Lower): 48-41 (Lower Right) | 31-38 (Lower Left)
const ADULT_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const ADULT_UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const ADULT_LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const ADULT_LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

const PEDIATRIC_UPPER_RIGHT = [55, 54, 53, 52, 51];
const PEDIATRIC_UPPER_LEFT = [61, 62, 63, 64, 65];
const PEDIATRIC_LOWER_RIGHT = [85, 84, 83, 82, 81];
const PEDIATRIC_LOWER_LEFT = [71, 72, 73, 74, 75];

export const CONDITION_COLORS: Record<ToothCondition, { bg: string; border: string; text: string; label: string }> = {
  healthy: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', label: 'سليم' },
  caries: { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-700', label: 'تسوس' },
  filled: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700', label: 'حشوة' },
  crown: { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-700', label: 'تاج / تلبيسة' },
  missing: { bg: 'bg-slate-200', border: 'border-slate-400', text: 'text-slate-500', label: 'مخلوع / مفقود' },
  implant: { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-700', label: 'زراعة' },
  root_canal: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700', label: 'علاج عصب' },
  bridge: { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-700', label: 'جسر' },
  fractured: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700', label: 'مكسور' },
  impacted: { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700', label: 'مطمور' },
  veneer: { bg: 'bg-cyan-100', border: 'border-cyan-400', text: 'text-cyan-700', label: 'فينير / عدسة' },
  sealant: { bg: 'bg-sky-100', border: 'border-sky-400', text: 'text-sky-700', label: 'ساد شقوق' },
  to_extract: { bg: 'bg-rose-200', border: 'border-rose-500', text: 'text-rose-800', label: 'بحاجة لخلع' },
};

export const Odontogram: React.FC<OdontogramProps> = ({
  records = [],
  selectedTooth: controlledSelectedTooth,
  onSelectTooth,
  onUpdateToothCondition,
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<'adult' | 'pediatric'>('adult');
  const [internalSelectedTooth, setInternalSelectedTooth] = useState<number | null>(null);

  const selectedTooth = controlledSelectedTooth !== undefined ? controlledSelectedTooth : internalSelectedTooth;

  const getToothRecord = (num: number): ToothRecord | undefined => {
    return records.find((r) => r.tooth_number === num);
  };

  const handleToothClick = (num: number) => {
    if (onSelectTooth) {
      onSelectTooth(num);
    } else {
      setInternalSelectedTooth(num);
    }
  };

  const currentRecord = selectedTooth ? getToothRecord(selectedTooth) : undefined;
  const currentCondition: ToothCondition = currentRecord?.condition || 'healthy';

  const renderTooth = (toothNumber: number) => {
    const record = getToothRecord(toothNumber);
    const condition = record?.condition || 'healthy';
    const isSelected = selectedTooth === toothNumber;
    const condConfig = CONDITION_COLORS[condition] || CONDITION_COLORS.healthy;

    const isMissing = condition === 'missing';

    return (
      <button
        key={toothNumber}
        type="button"
        onClick={() => handleToothClick(toothNumber)}
        className={cn(
          'flex flex-col items-center justify-between p-1.5 rounded-lg transition-all duration-150 relative select-none border',
          isSelected
            ? 'ring-2 ring-brand-navy border-brand-navy scale-105 z-10 bg-white shadow-md'
            : 'hover:border-slate-400 bg-white hover:bg-slate-50 border-slate-200'
        )}
        style={{ minWidth: '42px' }}
        title={`السن ${toothNumber} - ${condConfig.label}`}
      >
        <span className="text-[11px] font-bold text-slate-700 tracking-tight">{toothNumber}</span>

        {/* Anatomical 5-surface tooth diagram */}
        <div className="relative w-8 h-8 my-1 flex items-center justify-center">
          {isMissing ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <span className="text-xl font-bold">✕</span>
            </div>
          ) : (
            <svg viewBox="0 0 36 36" className="w-8 h-8 drop-shadow-sm">
              {/* Buccal / Facial (Top) */}
              <polygon
                points="2,2 34,2 26,10 10,10"
                className={cn(
                  'transition-colors stroke-[0.8] stroke-slate-400',
                  record?.surface === 'B' ? 'fill-blue-400' : condConfig.bg.replace('bg-', 'fill-')
                )}
              />
              {/* Lingual / Palatal (Bottom) */}
              <polygon
                points="10,26 26,26 34,34 2,34"
                className={cn(
                  'transition-colors stroke-[0.8] stroke-slate-400',
                  record?.surface === 'L' ? 'fill-blue-400' : condConfig.bg.replace('bg-', 'fill-')
                )}
              />
              {/* Mesial (Right in RTL context) */}
              <polygon
                points="34,2 34,34 26,26 26,10"
                className={cn(
                  'transition-colors stroke-[0.8] stroke-slate-400',
                  record?.surface === 'M' ? 'fill-blue-400' : condConfig.bg.replace('bg-', 'fill-')
                )}
              />
              {/* Distal (Left in RTL context) */}
              <polygon
                points="2,2 10,10 10,26 2,34"
                className={cn(
                  'transition-colors stroke-[0.8] stroke-slate-400',
                  record?.surface === 'D' ? 'fill-blue-400' : condConfig.bg.replace('bg-', 'fill-')
                )}
              />
              {/* Occlusal (Center) */}
              <rect
                x="10"
                y="10"
                width="16"
                height="16"
                className={cn(
                  'transition-colors stroke-[0.8] stroke-slate-400',
                  record?.surface === 'O' ? 'fill-blue-500' : condConfig.bg.replace('bg-', 'fill-')
                )}
              />
            </svg>
          )}
        </div>

        <span
          className={cn(
            'text-[9px] px-1 py-0.5 rounded font-semibold leading-none',
            condConfig.bg,
            condConfig.text
          )}
        >
          {condConfig.label}
        </span>
      </button>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col gap-4">
      {/* Header controls: Adult vs Pediatric & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('adult')}
              className={cn(
                'px-3 py-1.5 rounded-md transition-all',
                activeTab === 'adult' ? 'bg-white text-brand-navy shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              الأسنان الدائمة (32 سن)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pediatric')}
              className={cn(
                'px-3 py-1.5 rounded-md transition-all',
                activeTab === 'pediatric' ? 'bg-white text-brand-navy shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              الأسنان اللبنية (20 سن)
            </button>
          </div>
          <span className="text-xs text-slate-500 mr-2">نظام الترقيم الدولي (FDI)</span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {Object.entries(CONDITION_COLORS).slice(0, 6).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1">
              <span className={cn('w-2.5 h-2.5 rounded-full border', config.bg, config.border)} />
              <span className="text-slate-600 text-[11px]">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dental Arch Display */}
      <div className="flex flex-col gap-6 py-2 overflow-x-auto">
        {/* Upper Arch (Maxilla) */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-between w-full max-w-4xl px-4 text-xs font-semibold text-slate-500">
            <span>اليمين العلوي (يمين المريض)</span>
            <span className="text-brand-navy font-bold">الفك العلوي (Maxilla)</span>
            <span>اليسار العلوي (يسار المريض)</span>
          </div>

          <div className="flex items-center justify-center gap-3 w-full">
            {/* Upper Right Quadrant */}
            <div className="flex items-center gap-1.5">
              {(activeTab === 'adult' ? ADULT_UPPER_RIGHT : PEDIATRIC_UPPER_RIGHT).map(renderTooth)}
            </div>

            {/* Midline divider */}
            <div className="w-px h-16 bg-blue-300 mx-1 flex flex-col justify-center items-center">
              <span className="text-[10px] text-blue-500 font-bold rotate-90">خط المنتصف</span>
            </div>

            {/* Upper Left Quadrant */}
            <div className="flex items-center gap-1.5">
              {(activeTab === 'adult' ? ADULT_UPPER_LEFT : PEDIATRIC_UPPER_LEFT).map(renderTooth)}
            </div>
          </div>
        </div>

        {/* Horizontal separation between upper and lower jaw */}
        <div className="w-full border-t border-dashed border-slate-200" />

        {/* Lower Arch (Mandible) */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-3 w-full">
            {/* Lower Right Quadrant */}
            <div className="flex items-center gap-1.5">
              {(activeTab === 'adult' ? ADULT_LOWER_RIGHT : PEDIATRIC_LOWER_RIGHT).map(renderTooth)}
            </div>

            {/* Midline divider */}
            <div className="w-px h-16 bg-blue-300 mx-1 flex flex-col justify-center items-center">
              <span className="text-[10px] text-blue-500 font-bold rotate-90">خط المنتصف</span>
            </div>

            {/* Lower Left Quadrant */}
            <div className="flex items-center gap-1.5">
              {(activeTab === 'adult' ? ADULT_LOWER_LEFT : PEDIATRIC_LOWER_LEFT).map(renderTooth)}
            </div>
          </div>

          <div className="flex items-center justify-between w-full max-w-4xl px-4 text-xs font-semibold text-slate-500">
            <span>اليمين السفلي</span>
            <span className="text-brand-navy font-bold">الفك السفلي (Mandible)</span>
            <span>اليسار السفلي</span>
          </div>
        </div>
      </div>

      {/* Interactive condition bar if a tooth is selected & not read-only */}
      {selectedTooth && !readOnly && onUpdateToothCondition && (
        <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              السن رقم <span className="text-brand-navy text-sm font-black">{selectedTooth}</span>:
            </span>
            <Badge variant="neutral" className={CONDITION_COLORS[currentCondition].text}>
              الحالة الحالية: {CONDITION_COLORS[currentCondition].label}
            </Badge>
          </div>

          {/* Quick Condition Actions */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(Object.keys(CONDITION_COLORS) as ToothCondition[]).map((cond) => {
              const cfg = CONDITION_COLORS[cond];
              const isCurrent = currentCondition === cond;
              return (
                <button
                  key={cond}
                  type="button"
                  onClick={() => onUpdateToothCondition(selectedTooth, cond)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-md border font-medium transition-all flex items-center gap-1',
                    isCurrent
                      ? 'bg-brand-navy text-white border-brand-navy shadow-xs font-bold'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  )}
                >
                  {isCurrent && <Check className="w-3 h-3" />}
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Odontogram;
