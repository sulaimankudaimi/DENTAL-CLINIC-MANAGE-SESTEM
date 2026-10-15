import React from 'react';
import type { ToothRecord, Treatment } from '@shared/contracts';
import { Calendar, History, Check, X } from 'lucide-react';

export interface ToothTimelineProps {
  records: ToothRecord[];
  treatments?: Treatment[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  onClose: () => void;
}

export const ToothTimeline: React.FC<ToothTimelineProps> = ({
  records,
  treatments = [],
  selectedDate,
  onSelectDate,
  onClose,
}) => {
  // Extract unique recorded dates
  const dateMap = new Map<string, { recordCount: number; treatmentCount: number }>();

  records.forEach((r) => {
    const d = r.recorded_at ? r.recorded_at.split('T')[0] : '';
    if (d) {
      const prev = dateMap.get(d) || { recordCount: 0, treatmentCount: 0 };
      dateMap.set(d, { ...prev, recordCount: prev.recordCount + 1 });
    }
  });

  treatments.forEach((t) => {
    const d = t.performed_at ? t.performed_at.split('T')[0] : '';
    if (d) {
      const prev = dateMap.get(d) || { recordCount: 0, treatmentCount: 0 };
      dateMap.set(d, { ...prev, treatmentCount: prev.treatmentCount + 1 });
    }
  });

  // Sort descending
  const dates = Array.from(dateMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div
      className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 mb-3 animate-in fade-in slide-in-from-top-2 duration-150 select-none shadow-xs"
      id="tooth-timeline-bar"
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-700" />
          <h4 className="text-xs font-bold text-purple-950">
            مقارنة المخطط بالزيارات والتسجيلات السابقة:
          </h4>
          {selectedDate && (
            <span className="bg-purple-200 text-purple-900 text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
              معاينة تاريخ: {selectedDate}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedDate && (
            <button
              type="button"
              onClick={() => onSelectDate(null)}
              className="text-xs font-medium text-purple-700 hover:text-purple-900 underline"
            >
              العودة للحالة الراهنة
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
            title="إغلاق شريط المقارنة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {dates.length === 0 ? (
        <p className="text-xs text-purple-700 py-1">
          لا توجد زيارات سابقة مسجلة لهذا المريض بعد. يتم حفظ كل فحص بتاريخه تلقائياً.
        </p>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => onSelectDate(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap transition-all ${
              selectedDate === null
                ? 'bg-purple-700 text-white border-purple-800 font-bold shadow-xs'
                : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100/50'
            }`}
          >
            <span>الحالة الراهنة (اليوم)</span>
            {selectedDate === null && <Check className="w-3.5 h-3.5" />}
          </button>

          {dates.map(([dateStr, stats]) => {
            const isSelected = selectedDate === dateStr;
            const formatted = new Date(dateStr).toLocaleDateString('ar-SA', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onSelectDate(dateStr)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-purple-700 text-white border-purple-800 font-bold shadow-xs ring-2 ring-purple-300'
                    : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100/50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 opacity-70" />
                <span className="font-mono">{dateStr}</span>
                <span className="opacity-75 text-[11px]">({formatted})</span>
                <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.2 rounded font-mono">
                  {stats.recordCount} فحص
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
