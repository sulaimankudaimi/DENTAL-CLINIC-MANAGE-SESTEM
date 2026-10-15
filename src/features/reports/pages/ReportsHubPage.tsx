import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Search,
  BarChart3,
  CalendarCheck,
  CalendarX,
  UserCheck,
  UserPlus,
  Share2,
  MapPin,
  UserX,
  Activity,
  Smile,
  FileCheck,
  FlaskConical,
  Pill,
  PieChart as PieIcon,
  Receipt,
  Lock,
  CreditCard,
  Award,
  Users,
  Clock,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { REPORTS_CATALOG, REPORT_CATEGORIES_INFO } from '../data/reportsCatalog';
import type { ReportCategory, ReportFilterState, ReportGeneratedData } from '../types/reportsHub';
import type { ReportFilters, CreateScheduledReport } from '@shared/contracts';
import { ReportFilterBar } from '../components/ReportFilterBar';
import { ReportViewer } from '../components/ReportViewer';
import { ScheduleReportModal } from '../components/ScheduleReportModal';
import { ScheduledReportsManager } from '../components/ScheduledReportsManager';
import { ReportPrintView } from '../components/ReportPrintView';
import { exportToCsv } from '../components/ExportUtils';

// Map icon string to component
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  UserPlus,
  UserCheck,
  Share2,
  Users,
  MapPin,
  UserX,
  CalendarCheck,
  CalendarX,
  Clock,
  Armchair: Calendar,
  Stethoscope: Activity,
  Flame: TrendingUp,
  Activity,
  Smile,
  FileCheck,
  FlaskConical,
  Pill,
  TrendingUp,
  PieChart: PieIcon,
  Receipt,
  Lock,
  CreditCard,
  Award,
};

function computeDateRange(period: string, from?: string, to?: string): { from: string; to: string } {
  if (period === 'custom' && from && to) {
    return { from, to };
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  switch (period) {
    case 'today':
      return { from: todayStr, to: todayStr };
    case 'week': {
      const d = new Date(now.getTime() - 6 * 86400000);
      const wY = d.getFullYear();
      const wM = String(d.getMonth() + 1).padStart(2, '0');
      const wD = String(d.getDate()).padStart(2, '0');
      return { from: `${wY}-${wM}-${wD}`, to: todayStr };
    }
    case 'month': {
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      return { from: `${year}-${month}-01`, to: `${year}-${month}-${String(lastDay).padStart(2, '0')}` };
    }
    case 'quarter': {
      const qStart = Math.floor(now.getMonth() / 3) * 3 + 1;
      const qEnd = qStart + 2;
      const qLastDay = new Date(year, qEnd, 0).getDate();
      return {
        from: `${year}-${String(qStart).padStart(2, '0')}-01`,
        to: `${year}-${String(qEnd).padStart(2, '0')}-${String(qLastDay).padStart(2, '0')}`,
      };
    }
    case 'year':
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    default: {
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      return { from: `${year}-${month}-01`, to: `${year}-${month}-${String(lastDay).padStart(2, '0')}` };
    }
  }
}

export const ReportsHubPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('patients');
  const [activeReportId, setActiveReportId] = useState<string>('new_patients');
  const [globalSearch, setGlobalSearch] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<ReportFilterState>({
    period: 'month',
    from: undefined,
    to: undefined,
    doctorId: 'all',
    roomId: 'all',
    statusFilter: 'all',
    searchQuery: '',
  });

  // Small lookup lists for dropdowns only
  const { data: staffList = [] } = useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: async () => {
      const res = await api.staff.list({ page: 1, limit: 50 });
      return res.ok ? res.data.items : [];
    },
  });

  const { data: rooms = [] } = useQuery({
    queryKey: queryKeys.rooms.all,
    queryFn: async () => {
      const res = await api.rooms.list();
      return res.ok ? res.data : [];
    },
  });

  const doctorsList = useMemo(() => {
    return staffList
      .filter((u: any) => u.role === 'dentist' || u.role === 'owner')
      .map((d: any) => ({ id: d.id, name: d.full_name }));
  }, [staffList]);

  const roomsList = useMemo(() => {
    return rooms.map((r: any) => ({ id: r.id, name: r.name }));
  }, [rooms]);

  const availableReports = useMemo(() => {
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      return REPORTS_CATALOG.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.titleEn.toLowerCase().includes(q)
      );
    }
    return REPORTS_CATALOG.filter((r) => r.category === activeCategory);
  }, [activeCategory, globalSearch]);

  const currentReport = useMemo(() => {
    const found = REPORTS_CATALOG.find((r) => r.id === activeReportId);
    return found || REPORTS_CATALOG[0];
  }, [activeReportId]);

  // Compute canonical ISO dates & clean filter payload for IPC
  const dateRange = useMemo(
    () => computeDateRange(filters.period, filters.from, filters.to),
    [filters.period, filters.from, filters.to]
  );

  const cleanReportFilters: ReportFilters = useMemo(
    () => ({
      from: dateRange.from,
      to: dateRange.to,
      dentist_id: filters.doctorId !== 'all' ? filters.doctorId : undefined,
      branch_id: filters.roomId !== 'all' ? filters.roomId : undefined,
    }),
    [dateRange, filters.doctorId, filters.roomId]
  );

  // Debounced filters state for smooth user input (250ms debounce)
  const [debouncedFilters, setDebouncedFilters] = useState<ReportFilters>(cleanReportFilters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(cleanReportFilters);
    }, 250);
    return () => clearTimeout(timer);
  }, [cleanReportFilters]);

  // Unified server query via reports:getReport
  // placeholderData keeps the previous table visible while new filters are loading
  const {
    data: serverReportData,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['report_data', currentReport.id, debouncedFilters],
    queryFn: async () => {
      const res = await api.reports.getReport(currentReport.id, debouncedFilters);
      if (!res.ok) {
        throw new Error(res.error || 'فشل تحميل بيانات التقرير');
      }
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const reportData: ReportGeneratedData = useMemo(() => {
    if (serverReportData) return serverReportData;
    return {
      reportId: currentReport.id,
      kpis: [],
      chartData: [],
      tableColumns: [],
      tableRows: [],
    };
  }, [serverReportData, currentReport.id]);

  // Export to Excel / CSV with applied filters in header
  const handleExportExcel = () => {
    const filename = `${currentReport.id}_${debouncedFilters.from}_${debouncedFilters.to}`;
    const filterInfo = [
      `التقرير: ${currentReport.title}`,
      `الفترة: من ${debouncedFilters.from} إلى ${debouncedFilters.to}`,
      `الطبيب: ${filters.doctorId === 'all' ? 'كافة الأطباء' : filters.doctorId}`,
      `تاريخ الاستخراج: ${new Date().toISOString().slice(0, 10)}`,
      '',
    ];
    const headers = reportData.tableColumns.map((col) => col.header);
    const rows = reportData.tableRows.map((row) =>
      reportData.tableColumns.map((col) => row[col.key] ?? '')
    );
    exportToCsv(filename, headers, rows, filterInfo);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveSchedule = async (data: CreateScheduledReport) => {
    await api.reports.createScheduledReport(data);
  };

  return (
    <div className="space-y-6">
      {/* 1. Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-brand-navy">
                  مركز التقارير السريرية والمالية الشامل
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-blue/10 text-brand-blue">
                  24 تقريراً معتمداً
                </span>
                {isFetching && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>تحديث البيانات...</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                تحليلات مجمعة من قاعدة البيانات لحركة المرضى والمواعيد وقوائم الدخل والضريبة في ثوانٍ معدودة.
              </p>
            </div>
          </div>
        </div>

        {/* Global Search across all 24 reports */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-text-muted absolute start-3 top-3" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="بحث في الـ 24 تقريراً..."
            className="w-full h-10 rounded-xl border border-border bg-slate-50 ps-9 pe-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>
      </div>

      {/* 2. Category Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border/80 print:hidden">
        {REPORT_CATEGORIES_INFO.map((cat) => {
          const isActive = activeCategory === cat.id && !globalSearch.trim();
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setGlobalSearch('');
                setActiveCategory(cat.id);
                if (cat.id !== 'scheduled') {
                  const first = REPORTS_CATALOG.find((r) => r.category === cat.id);
                  if (first) setActiveReportId(first.id);
                }
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'bg-white text-text-secondary hover:text-text-primary hover:bg-slate-100 border border-border'
              }`}
            >
              <span>{cat.name}</span>
              {cat.count && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* If Scheduled Tab is Active */}
      {activeCategory === 'scheduled' && !globalSearch.trim() ? (
        <ScheduledReportsManager
          onOpenNewScheduleModal={() => setIsScheduleModalOpen(true)}
        />
      ) : (
        <>
          {/* 3. Reports Grid / Selector within Category */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-border space-y-2 print:hidden">
            <div className="flex items-center justify-between text-xs text-text-muted px-1">
              <span>اختر التقرير المراد عرضه ({availableReports.length} تقرير متاح):</span>
              {globalSearch.trim() && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  className="text-brand-blue hover:underline text-[11px]"
                >
                  مسح البحث
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {availableReports.map((rep) => {
                const isSelected = activeReportId === rep.id;
                const IconComponent = ICON_MAP[rep.iconName] || BarChart3;

                return (
                  <button
                    key={rep.id}
                    type="button"
                    onClick={() => setActiveReportId(rep.id)}
                    className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-white border-brand-blue shadow-xs ring-1 ring-brand-blue/20'
                        : 'bg-white/70 border-border hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-brand-blue text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs truncate block ${
                            isSelected ? 'font-bold text-brand-navy' : 'font-medium text-text-primary'
                          }`}
                        >
                          {rep.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted truncate mt-0.5">
                        {rep.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Active Report Title & Description */}
          <div className="flex items-center justify-between gap-4 border-b border-border pb-3 print:hidden">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">
                  {currentReport.title}
                </h2>
                {currentReport.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-blue/10 text-brand-blue">
                    {currentReport.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">{currentReport.description}</p>
            </div>
          </div>

          {/* 5. Filter Toolbar */}
          <ReportFilterBar
            report={currentReport}
            filters={filters}
            onFiltersChange={setFilters}
            doctorsList={doctorsList}
            roomsList={roomsList}
            onRefresh={() => refetch()}
            onExportExcel={handleExportExcel}
            onPrint={handlePrint}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            isLoading={isFetching}
          />

          {/* 6. Main Report Viewer (KPIs + Chart + Table) */}
          <div className="print:hidden">
            <ReportViewer
              report={currentReport}
              data={reportData}
              searchQuery={filters.searchQuery}
            />
          </div>

          {/* 7. Hidden Print Component for window.print() and PDF generation */}
          <ReportPrintView
            report={currentReport}
            data={reportData}
            filters={filters}
          />
        </>
      )}

      {/* Schedule Report Modal */}
      <ScheduleReportModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        report={currentReport}
        onSaveSchedule={handleSaveSchedule}
      />
    </div>
  );
};
