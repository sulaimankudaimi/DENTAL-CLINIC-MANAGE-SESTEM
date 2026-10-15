import React, { useState } from 'react';
import {
  Calendar,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  Search,
  User,
  DoorOpen,
  CalendarClock,
} from 'lucide-react';
import type { ReportPeriod } from '@shared/contracts';
import type { ReportFilterState, ReportDefinition } from '../types/reportsHub';
import { Button } from '@/components/ui/Button';

interface ReportFilterBarProps {
  report?: ReportDefinition;
  filters: ReportFilterState;
  onFiltersChange: (filters: ReportFilterState) => void;
  doctorsList: Array<{ id: string; name: string }>;
  roomsList: Array<{ id: string; name: string }>;
  onRefresh: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
  onOpenScheduleModal: () => void;
  isLoading?: boolean;
}

const PERIOD_PRESETS: Array<{ id: ReportPeriod; label: string }> = [
  { id: 'today', label: 'اليوم' },
  { id: 'week', label: 'الأسبوع' },
  { id: 'month', label: 'الشهر الحالي' },
  { id: 'quarter', label: 'الربع الحالي' },
  { id: 'year', label: 'هذا العام' },
  { id: 'custom', label: 'تاريخ مخصص' },
];

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  filters,
  onFiltersChange,
  doctorsList,
  roomsList,
  onRefresh,
  onExportExcel,
  onPrint,
  onOpenScheduleModal,
  isLoading = false,
}) => {
  const [showCustomRange, setShowCustomRange] = useState(filters.period === 'custom');

  const handlePeriodClick = (p: ReportPeriod) => {
    if (p === 'custom') {
      setShowCustomRange(true);
      onFiltersChange({
        ...filters,
        period: 'custom',
        from: filters.from || new Date().toISOString().split('T')[0],
        to: filters.to || new Date().toISOString().split('T')[0],
      });
    } else {
      setShowCustomRange(false);
      onFiltersChange({
        ...filters,
        period: p,
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-4 shadow-xs space-y-4 print:hidden">
      {/* Top row: Presets & Actions */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Period Presets buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-text-muted ms-2 me-1 shrink-0" />
          {PERIOD_PRESETS.map((p) => {
            const isActive = filters.period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePeriodClick(p.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-blue text-white font-bold shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/60'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Schedule, Export, Print, Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenScheduleModal}
            className="h-9 px-3 text-xs gap-1.5 text-brand-blue border-brand-blue/30 hover:bg-brand-blue/5 font-semibold"
          >
            <CalendarClock className="w-4 h-4 text-brand-blue" />
            <span>جدولة دورية (PDF)</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onExportExcel}
            className="h-9 px-3 text-xs gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel (CSV)</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onPrint}
            className="h-9 px-3 text-xs gap-1.5 text-text-primary hover:bg-slate-100"
          >
            <Printer className="w-4 h-4 text-text-secondary" />
            <span>طباعة / حفظ PDF</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            loading={isLoading}
            className="h-9 w-9 p-0 text-text-muted hover:text-brand-blue"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Second row: Custom Dates & Dropdown Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-3 border-t border-border/60">
        {/* Custom Date from/to if selected */}
        {showCustomRange && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary mb-1">من تاريخ</label>
              <input
                type="date"
                value={filters.from || ''}
                onChange={(e) => onFiltersChange({ ...filters, from: e.target.value })}
                className="w-full h-9 rounded-xl border border-border bg-white px-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={filters.to || ''}
                onChange={(e) => onFiltersChange({ ...filters, to: e.target.value })}
                className="w-full h-9 rounded-xl border border-border bg-white px-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
          </>
        )}

        {/* Doctor Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-text-secondary mb-1 flex items-center gap-1">
            <User className="w-3 h-3 text-brand-blue" />
            <span>الطبيب المعالج</span>
          </label>
          <select
            value={filters.doctorId}
            onChange={(e) => onFiltersChange({ ...filters, doctorId: e.target.value })}
            className="w-full h-9 rounded-xl border border-border bg-white px-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          >
            <option value="all">كافة الأطباء</option>
            {doctorsList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Room / Chair Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-text-secondary mb-1 flex items-center gap-1">
            <DoorOpen className="w-3 h-3 text-brand-teal" />
            <span>العيادة / الكرسي</span>
          </label>
          <select
            value={filters.roomId}
            onChange={(e) => onFiltersChange({ ...filters, roomId: e.target.value })}
            className="w-full h-9 rounded-xl border border-border bg-white px-2.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          >
            <option value="all">كافة العيادات والكراسي</option>
            {roomsList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Search inside Table */}
        <div className={showCustomRange ? 'md:col-span-2 lg:col-span-1' : 'md:col-span-2'}>
          <label className="block text-[11px] font-semibold text-text-secondary mb-1">بحث في نتائج التقرير</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute start-2.5 top-2.5" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
              placeholder="بحث بالاسم، الكود، البيان..."
              className="w-full h-9 rounded-xl border border-border bg-white ps-8 pe-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
