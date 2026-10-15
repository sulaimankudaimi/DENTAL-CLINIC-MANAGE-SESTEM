import React, { useState } from 'react';
import {
  Calendar,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  Clock,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import type { ReportPeriod } from '@shared/contracts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface ReportShellProps {
  title: string;
  description?: string;
  badgeText?: string;
  period: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
  customFrom?: string;
  customTo?: string;
  onCustomRangeChange?: (from: string, to: string) => void;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  onPrint?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  statsSlot?: React.ReactNode;
  chartsSlot?: React.ReactNode;
  filtersSlot?: React.ReactNode;
  children?: React.ReactNode;
}

const PERIOD_OPTIONS: Array<{ id: ReportPeriod; label: string }> = [
  { id: 'today', label: 'اليوم' },
  { id: 'week', label: 'الأسبوع' },
  { id: 'month', label: 'الشهر الحالي' },
  { id: 'quarter', label: 'الربع الحالي' },
  { id: 'year', label: 'هذا العام' },
  { id: 'custom', label: 'فترة مخصصة' },
];

export const ReportShell: React.FC<ReportShellProps> = ({
  title,
  description,
  badgeText,
  period,
  onPeriodChange,
  customFrom,
  customTo,
  onCustomRangeChange,
  onExportExcel,
  onExportPdf,
  onPrint,
  onRefresh,
  isLoading = false,
  statsSlot,
  chartsSlot,
  filtersSlot,
  children,
}) => {
  const [fromDate, setFromDate] = useState(customFrom || new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(customTo || new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleApplyCustomRange = () => {
    if (onCustomRangeChange) {
      onCustomRangeChange(fromDate, toDate);
    }
    setShowDatePicker(false);
  };

  const handlePrintClick = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-zinc-800/80 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{title}</h1>
            {badgeText && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                <Sparkles className="w-3 h-3" />
                {badgeText}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-2xl">{description}</p>
          )}
        </div>

        {/* Right side Action Buttons (Export, Print, Refresh) */}
        <div className="flex flex-wrap items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              title="تحديث البيانات"
              className="h-9 w-9 p-0 flex items-center justify-center rounded-xl border-zinc-200 dark:border-zinc-700"
            >
              <RefreshCw className={cn('w-4 h-4 text-zinc-600 dark:text-zinc-300', isLoading && 'animate-spin text-primary')} />
            </Button>
          )}

          {onExportExcel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportExcel}
              className="h-9 px-3 gap-1.5 text-xs font-medium rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800/60 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>تصدير Excel</span>
            </Button>
          )}

          {onExportPdf && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportPdf}
              className="h-9 px-3 gap-1.5 text-xs font-medium rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800/60 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>تصدير PDF</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrintClick}
            className="h-9 px-3.5 gap-1.5 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </Button>
        </div>
      </div>

      {/* Period Filter Bar & Contextual Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 print:hidden">
        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 pl-2">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>الفترة:</span>
          </div>

          <div className="flex flex-wrap items-center p-1 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700/60 shadow-2xs">
            {PERIOD_OPTIONS.map((opt) => {
              const isActive = period === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onPeriodChange(opt.id);
                    if (opt.id === 'custom') {
                      setShowDatePicker(true);
                    }
                  }}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                    isActive
                      ? 'bg-primary text-white shadow-xs font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Range Trigger */}
          {period === 'custom' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-200 hover:border-primary shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>
                  {fromDate} إلى {toDate}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {showDatePicker && (
                <div className="absolute top-full mt-2 right-0 z-40 bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 w-72 space-y-3">
                  <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-700/60 pb-2">
                    تحديد فترة التاريخ المخصصة
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      من تاريخ:
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      إلى تاريخ:
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDatePicker(false)}
                      className="h-7 text-xs px-2.5"
                    >
                      إلغاء
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleApplyCustomRange}
                      className="h-7 text-xs px-3"
                    >
                      تطبيق
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Additional Filters Slot (e.g. Doctor, Procedure, Insurance) */}
        {filtersSlot && <div className="flex items-center gap-2">{filtersSlot}</div>}
      </div>

      {/* Print-Only Header */}
      <div className="hidden print:block p-4 border-b-2 border-zinc-900 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black">{title}</h1>
            <p className="text-sm text-zinc-600 mt-1">
              الفترة: {period === 'custom' ? `${fromDate} إلى ${toDate}` : period} | تاريخ التوليد: {new Date().toLocaleDateString('ar-SA')}
            </p>
          </div>
          <div className="text-left">
            <span className="text-sm font-bold block">مجمع عيادات أفق التخصصي لطب الأسنان</span>
            <span className="text-xs text-zinc-500">نظام عيادتي الطبي السحابي</span>
          </div>
        </div>
      </div>

      {/* Stats Cards Slot */}
      {statsSlot && <div>{statsSlot}</div>}

      {/* Visual Charts Slot */}
      {chartsSlot && <div>{chartsSlot}</div>}

      {/* Table Data Slot */}
      {children && <div>{children}</div>}
    </div>
  );
};
