import React from 'react';
import { DENTAL_COLORS } from '../lib/conditionColors';
import type { ToothRecord, ToothCondition } from '@shared/contracts';

export interface ChartLegendProps {
  records?: ToothRecord[];
  onFilterCondition?: (condition: ToothCondition | null) => void;
  activeFilter?: ToothCondition | null;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({
  records = [],
  onFilterCondition,
  activeFilter = null,
}) => {
  // Count teeth per condition
  const counts = records.reduce<Record<string, number>>((acc, rec) => {
    acc[rec.condition] = (acc[rec.condition] || 0) + 1;
    return acc;
  }, {});

  const legendItems = [
    {
      id: 'healthy',
      label: 'سليم',
      color: DENTAL_COLORS.healthy.fill,
      borderColor: DENTAL_COLORS.healthy.stroke,
      badge: 'white',
      desc: 'طبيعي',
    },
    {
      id: 'caries',
      label: 'تسوس',
      color: DENTAL_COLORS.caries.fill,
      borderColor: DENTAL_COLORS.caries.stroke,
      badge: 'red',
      desc: 'نخر نشط',
    },
    {
      id: 'filled',
      label: 'حشوة',
      color: DENTAL_COLORS.filled.fill,
      borderColor: DENTAL_COLORS.filled.stroke,
      badge: 'blue',
      desc: 'ترميم سابق',
    },
    {
      id: 'crown',
      label: 'تاج / تلبيسة',
      color: DENTAL_COLORS.crown.fill,
      borderColor: DENTAL_COLORS.crown.stroke,
      badge: 'amber',
      desc: 'تعويض ثابت',
    },
    {
      id: 'bridge',
      label: 'جسر',
      color: DENTAL_COLORS.bridge.fill,
      borderColor: DENTAL_COLORS.bridge.stroke,
      badge: 'purple',
      desc: 'دعامة جسر',
    },
    {
      id: 'implant',
      label: 'زرعة',
      color: DENTAL_COLORS.implant.fill,
      borderColor: DENTAL_COLORS.implant.stroke,
      badge: 'teal',
      desc: 'تيتانيوم',
    },
    {
      id: 'missing',
      label: 'مفقود (✕)',
      color: DENTAL_COLORS.missing.fill,
      borderColor: DENTAL_COLORS.missing.stroke,
      hasCross: true,
      badge: 'slate',
      desc: 'مخلوع',
    },
    {
      id: 'root_canal',
      label: 'علاج عصب',
      color: '#FFFFFF',
      borderColor: '#DC2626',
      hasCanalLine: true,
      badge: 'red',
      desc: 'خط أحمر بالجذر',
    },
    {
      id: 'fractured',
      label: 'كسر',
      color: '#FFFFFF',
      borderColor: '#F97316',
      hasZigzag: true,
      badge: 'orange',
      desc: 'خط متعرج',
    },
    {
      id: 'planned',
      label: 'مخطط (planned)',
      color: '#DBEAFE',
      borderColor: '#3B82F6',
      isDashed: true,
      badge: 'sky',
      desc: 'إطار منقّط',
    },
  ];

  return (
    <div
      className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs"
      id="chart-legend"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">وسيلة إيضاح الحالات:</span>
          <span className="text-[11px] text-slate-400">
            انقر على أي حالة لتصفية الأسنان
          </span>
        </div>

        {activeFilter && (
          <button
            type="button"
            onClick={() => onFilterCondition?.(null)}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
          >
            إلغاء التصفية (عرض الكل)
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
        {legendItems.map((item) => {
          const isSelected = activeFilter === item.id;
          const count = counts[item.id] || 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                item.id !== 'planned' &&
                onFilterCondition?.(isSelected ? null : (item.id as ToothCondition))
              }
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-200 shadow-xs font-bold'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }
              `}
            >
              {/* Visual mini-chip */}
              <div
                className={`w-4 h-4 rounded-sm flex items-center justify-center relative overflow-hidden shrink-0 border
                  ${item.isDashed ? 'border-dashed border-2 border-blue-500' : ''}
                `}
                style={{
                  backgroundColor: item.color,
                  borderColor: item.isDashed ? '#3B82F6' : item.borderColor,
                }}
              >
                {item.hasCross && (
                  <span className="text-red-500 text-[11px] font-bold leading-none">✕</span>
                )}
                {item.hasCanalLine && (
                  <div className="w-0.5 h-full bg-red-600" />
                )}
                {item.hasZigzag && (
                  <div className="w-full h-0.5 bg-orange-500 transform rotate-45" />
                )}
              </div>

              <span className="whitespace-nowrap font-medium">{item.label}</span>

              {count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
