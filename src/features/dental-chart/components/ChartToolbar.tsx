import React from 'react';
import type { ToothCondition } from '@shared/contracts';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  History,
  Zap,
} from 'lucide-react';

export type DentitionMode = 'permanent' | 'primary' | 'mixed';
export type ChartViewFilter = 'all' | 'existing' | 'planned' | 'completed';

export interface ChartToolbarProps {
  dentitionMode: DentitionMode;
  onDentitionModeChange: (mode: DentitionMode) => void;
  viewFilter: ChartViewFilter;
  onViewFilterChange: (filter: ChartViewFilter) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onPrint: () => void;
  isTimelineOpen: boolean;
  onToggleTimeline: () => void;
  isQuickExamActive: boolean;
  onToggleQuickExam: () => void;
  quickExamCondition: ToothCondition;
  onQuickExamConditionChange: (cond: ToothCondition) => void;
}

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  dentitionMode,
  onDentitionModeChange,
  viewFilter,
  onViewFilterChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onPrint,
  isTimelineOpen,
  onToggleTimeline,
  isQuickExamActive,
  onToggleQuickExam,
  quickExamCondition,
  onQuickExamConditionChange,
}) => {
  return (
    <div
      className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 select-none"
      id="chart-toolbar"
    >
      {/* 1. Dentition Mode Switcher (Permanent / Primary / Mixed) */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => onDentitionModeChange('permanent')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            dentitionMode === 'permanent'
              ? 'bg-white text-blue-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          أسنان دائمة (32)
        </button>
        <button
          type="button"
          onClick={() => onDentitionModeChange('primary')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            dentitionMode === 'primary'
              ? 'bg-white text-blue-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          أسنان لبنية (20)
        </button>
        <button
          type="button"
          onClick={() => onDentitionModeChange('mixed')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            dentitionMode === 'mixed'
              ? 'bg-white text-blue-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          مختلط (Mixed)
        </button>
      </div>

      {/* 2. View Mode Selector: All / Current / Planned / Completed */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-slate-400 font-medium">العرض:</span>
        <div className="flex items-center bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => onViewFilterChange('all')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              viewFilter === 'all'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل
          </button>
          <button
            type="button"
            onClick={() => onViewFilterChange('existing')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              viewFilter === 'existing'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الحالة الحالية
          </button>
          <button
            type="button"
            onClick={() => onViewFilterChange('planned')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              viewFilter === 'planned'
                ? 'bg-white text-blue-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            خطة العلاج
          </button>
          <button
            type="button"
            onClick={() => onViewFilterChange('completed')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              viewFilter === 'completed'
                ? 'bg-white text-emerald-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            المكتمل
          </button>
        </div>
      </div>

      {/* 3. Action Tools: Timeline comparison, Quick exam mode, Zoom, Print */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Timeline Comparison Toggle */}
        <button
          type="button"
          onClick={onToggleTimeline}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            isTimelineOpen
              ? 'bg-purple-50 border-purple-300 text-purple-700 ring-2 ring-purple-100 shadow-xs'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
          title="مقارنة المخطط بزيارة أو تاريخ سابق"
        >
          <History className="w-3.5 h-3.5 text-purple-600" />
          <span>مقارنة بتاريخ</span>
        </button>

        {/* Quick Exam Mode Toggle */}
        <button
          type="button"
          onClick={onToggleQuickExam}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            isQuickExamActive
              ? 'bg-amber-50 border-amber-400 text-amber-800 ring-2 ring-amber-100 shadow-xs font-bold animate-pulse'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
          title="تفعيل وضع الفحص السريع لتلوين عدة أسنان بضغطة واحدة"
        >
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          <span>وضع الفحص السريع</span>
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={zoom <= 0.7}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors disabled:opacity-30"
            title="تصغير"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono font-semibold px-2 text-slate-700 min-w-[40px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            disabled={zoom >= 1.6}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors disabled:opacity-30"
            title="تكبير"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onZoomReset}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors"
            title="إعادة ضبط الحجم الطبيعي"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Print Button */}
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
          title="طباعة مخطط الأسنان"
        >
          <Printer className="w-3.5 h-3.5 text-slate-600" />
          <span>طباعة</span>
        </button>
      </div>

      {/* Quick Exam Mode Condition Bar (Visible when Quick Exam is Active) */}
      {isQuickExamActive && (
        <div className="w-full mt-2 pt-2 border-t border-amber-200/60 bg-amber-50/70 p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span className="text-xs font-bold text-amber-900">
              وضع الفحص السريع مفعل:
            </span>
            <span className="text-xs text-amber-800">
              اختر الحالة ثم انقر مباشرة على أي سن لتطبيقها فوراً
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { id: 'healthy', label: 'سليم', bg: 'bg-white text-slate-800 border-slate-300' },
              { id: 'caries', label: 'تسوس', bg: 'bg-rose-600 text-white border-rose-700' },
              { id: 'filled', label: 'حشوة', bg: 'bg-blue-600 text-white border-blue-700' },
              { id: 'missing', label: 'مفقود ✕', bg: 'bg-slate-600 text-white border-slate-700' },
              { id: 'crown', label: 'تاج', bg: 'bg-amber-500 text-white border-amber-600' },
              { id: 'root_canal', label: 'عصب', bg: 'bg-red-600 text-white border-red-700' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onQuickExamConditionChange(c.id as ToothCondition)}
                className={`px-2.5 py-1 rounded text-xs font-bold border transition-all ${c.bg} ${
                  quickExamCondition === c.id
                    ? 'ring-2 ring-amber-400 scale-105 shadow-xs'
                    : 'opacity-85 hover:opacity-100'
                }`}
              >
                {c.label}
              </button>
            ))}

            <button
              type="button"
              onClick={onToggleQuickExam}
              className="mr-2 text-xs text-slate-500 hover:text-slate-800 underline"
            >
              إنهاء الفحص
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
