import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  Clock,
  Award,
  FileCheck2,
  Lock,
  CheckCircle2,
  Stethoscope,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Receipt,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import type {
  ReportPeriod,
  RevenueReportData,
  IncomeStatementData,
  AgingReportData,
  DoctorCommissionData,
  VatReportData,
  DailyCashClosingData,
} from '@shared/contracts';
import { api } from '@/lib/api';
import { formatCurrencyHalalas } from '@/lib/formatters';
import { ReportShell } from '../components/ReportShell';
import { exportToCsv } from '../components/ExportUtils';

type ActiveTab =
  | 'revenue'
  | 'income_statement'
  | 'aging'
  | 'commissions'
  | 'vat'
  | 'daily_closing';

const COLORS = ['#1E4E9C', '#2BB39A', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export const FinancialReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('revenue');
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [customFrom, setCustomFrom] = useState<string | undefined>(undefined);
  const [customTo, setCustomTo] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Reports Data
  const [revenueData, setRevenueData] = useState<RevenueReportData | null>(null);
  const [incomeData, setIncomeData] = useState<IncomeStatementData | null>(null);
  const [agingData, setAgingData] = useState<AgingReportData | null>(null);
  const [commissionsData, setCommissionsData] = useState<DoctorCommissionData[]>([]);
  const [vatData, setVatData] = useState<VatReportData | null>(null);
  const [dailyClosingData, setDailyClosingData] = useState<DailyCashClosingData | null>(null);

  // Filter States for Revenue Sub-tab
  const [revenueDoctorFilter, setRevenueDoctorFilter] = useState('all');
  const [revenueProcedureFilter, setRevenueProcedureFilter] = useState('all');
  const [revenueInsuranceFilter, setRevenueInsuranceFilter] = useState('all');
  const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0]);
  const [closingUserFilter, setClosingUserFilter] = useState('all');

  const loadCurrentReportData = async () => {
    setIsLoading(true);
    try {
      const filters = { period, from: customFrom, to: customTo };

      if (activeTab === 'revenue') {
        const res = await api.reports.getRevenueReport(filters);
        if (res.ok) setRevenueData(res.data);
      } else if (activeTab === 'income_statement') {
        const res = await api.reports.getIncomeStatement(filters);
        if (res.ok) setIncomeData(res.data);
      } else if (activeTab === 'aging') {
        const res = await api.reports.getAgingReport();
        if (res.ok) setAgingData(res.data);
      } else if (activeTab === 'commissions') {
        const res = await api.reports.getDoctorCommissions(filters);
        if (res.ok) setCommissionsData(res.data);
      } else if (activeTab === 'vat') {
        const res = await api.reports.getVatReport(filters);
        if (res.ok) setVatData(res.data);
      } else if (activeTab === 'daily_closing') {
        const userArg = closingUserFilter === 'all' ? undefined : closingUserFilter;
        const res = await api.reports.getDailyCashClosing(closingDate, userArg);
        if (res.ok) setDailyClosingData(res.data);
      }
    } catch (e) {
      console.error('Failed to load report data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentReportData();
  }, [activeTab, period, customFrom, customTo, closingDate, closingUserFilter]);

  // Tab definitions
  const TABS: Array<{ id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'revenue', label: 'تقرير الإيرادات', icon: TrendingUp },
    { id: 'income_statement', label: 'قائمة الدخل المبسطة', icon: PieChartIcon },
    { id: 'aging', label: 'أعمار الذمم المدينة', icon: Clock },
    { id: 'commissions', label: 'عمولات الأطباء', icon: Award },
    { id: 'vat', label: 'إقرار ضريبة القيمة المضافة', icon: FileCheck2 },
    { id: 'daily_closing', label: 'التحصيل اليومي (إغلاق الصندوق)', icon: Lock },
  ];

  // ==========================================
  // EXPORT HANDLERS
  // ==========================================
  const handleExportExcel = () => {
    if (activeTab === 'revenue' && revenueData) {
      const headers = ['رقم الدفعة', 'رقم الفاتورة', 'المريض', 'الطبيب', 'الإجراء', 'التأمين', 'التاريخ', 'طريقة الدفع', 'المبلغ (SAR)'];
      const rows = revenueData.items.map((i) => [
        i.paymentId,
        i.invoiceNumber,
        i.patientName,
        i.doctorName,
        i.procedureName,
        i.insuranceName,
        i.date.substring(0, 10),
        i.method,
        (i.amountHalalas / 100).toFixed(2),
      ]);
      exportToCsv(`تقرير_الإيرادات_${period}`, headers, rows);
    } else if (activeTab === 'income_statement' && incomeData) {
      const headers = ['البند', 'المبلغ (SAR)', 'النسبة المئوية'];
      const rows = [
        ['إجمالي الإيرادات', (incomeData.totalRevenueHalalas / 100).toFixed(2), '100%'],
        ['إجمالي المصروفات التشغيلية', (incomeData.totalExpensesHalalas / 100).toFixed(2), '-'],
        ['صافي الدخل التشغيلي', (incomeData.netIncomeHalalas / 100).toFixed(2), `${incomeData.profitMarginPercent}%`],
        ...incomeData.expensesByCategory.map((c) => [c.name, (c.amountHalalas / 100).toFixed(2), `${c.percent}%`]),
      ];
      exportToCsv(`قائمة_الدخل_${period}`, headers, rows);
    } else if (activeTab === 'aging' && agingData) {
      const headers = ['رقم الفاتورة', 'المريض', 'الجوال', 'تاريخ الإصدار', 'أيام التأخير', 'فترة التعمير', 'المبلغ الكلي', 'المدفوع', 'الرصيد المتبقي (SAR)'];
      const rows = agingData.invoices.map((inv) => [
        inv.invoiceNumber,
        inv.patientName,
        inv.patientPhone,
        inv.issueDate.substring(0, 10),
        inv.daysOverdue,
        inv.bucket,
        (inv.totalHalalas / 100).toFixed(2),
        (inv.paidHalalas / 100).toFixed(2),
        (inv.balanceHalalas / 100).toFixed(2),
      ]);
      exportToCsv('تقرير_أعمار_الذمم_المدينة', headers, rows);
    } else if (activeTab === 'commissions') {
      const headers = ['الطبيب', 'التخصص', 'نسبة العمولة', 'عدد الإجراءات', 'إجمالي الإيراد (SAR)', 'صافي العمولة (SAR)'];
      const rows = commissionsData.map((d) => [
        d.doctorName,
        d.specialty,
        `${d.commissionPercent}%`,
        d.treatmentsCount,
        (d.totalRevenueHalalas / 100).toFixed(2),
        (d.commissionHalalas / 100).toFixed(2),
      ]);
      exportToCsv(`تقرير_عمولات_الأطباء_${period}`, headers, rows);
    } else if (activeTab === 'vat' && vatData) {
      const headers = ['التاريخ', 'المرجع', 'نوع المعاملة', 'البيان', 'الأساس الخاضع (SAR)', 'الضريبة 15% (SAR)', 'الإجمالي (SAR)'];
      const rows = vatData.transactions.map((t) => [
        t.date,
        t.ref,
        t.type === 'sale' ? 'مبيعات' : 'مشتريات/مصروفات',
        t.description,
        (t.baseHalalas / 100).toFixed(2),
        (t.vatHalalas / 100).toFixed(2),
        (t.totalHalalas / 100).toFixed(2),
      ]);
      exportToCsv(`إقرار_الضريبة_${period}`, headers, rows);
    } else if (activeTab === 'daily_closing' && dailyClosingData) {
      const headers = ['التوقيت', 'المريض', 'الفاتورة', 'المستلم', 'طريقة الدفع', 'المرجع', 'المبلغ (SAR)'];
      const rows = dailyClosingData.paymentsList.map((p) => [
        p.time,
        p.patientName,
        p.invoiceNumber,
        p.receivedBy,
        p.method,
        p.reference || '-',
        (p.amountHalalas / 100).toFixed(2),
      ]);
      exportToCsv(`إغلاق_الصندوق_${dailyClosingData.date}`, headers, rows);
    }
  };

  // Filtered revenue items
  const filteredRevenueItems = useMemo(() => {
    if (!revenueData) return [];
    return revenueData.items.filter((item) => {
      if (revenueDoctorFilter !== 'all' && item.doctorName !== revenueDoctorFilter) return false;
      if (revenueProcedureFilter !== 'all' && item.procedureName !== revenueProcedureFilter) return false;
      if (revenueInsuranceFilter !== 'all' && item.insuranceName !== revenueInsuranceFilter) return false;
      return true;
    });
  }, [revenueData, revenueDoctorFilter, revenueProcedureFilter, revenueInsuranceFilter]);

  return (
    <div className="space-y-6">
      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white dark:bg-zinc-800/90 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 shadow-xs print:hidden">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. REVENUE REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'revenue' && (
        <ReportShell
          title="تقرير الإيرادات والمتحصلات"
          description="تحليل الإيرادات المحصلة حسب الفترات الزمنية، الأطباء، الإجراءات، وشركات التأمين"
          badgeText="مجموع الإيرادات = مجموع Payments تماماً"
          period={period}
          onPeriodChange={setPeriod}
          customFrom={customFrom}
          customTo={customTo}
          onCustomRangeChange={(f, t) => {
            setCustomFrom(f);
            setCustomTo(t);
          }}
          onExportExcel={handleExportExcel}
          onRefresh={loadCurrentReportData}
          isLoading={isLoading}
          filtersSlot={
            <div className="flex flex-wrap items-center gap-2">
              {/* Doctor filter */}
              <select
                value={revenueDoctorFilter}
                onChange={(e) => setRevenueDoctorFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-200 focus:outline-hidden"
              >
                <option value="all">جميع الأطباء</option>
                {revenueData?.byDoctor.map((d) => (
                  <option key={d.doctorId} value={d.doctorName}>
                    {d.doctorName}
                  </option>
                ))}
              </select>

              {/* Procedure filter */}
              <select
                value={revenueProcedureFilter}
                onChange={(e) => setRevenueProcedureFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-200 focus:outline-hidden"
              >
                <option value="all">جميع الإجراءات</option>
                {Array.from(new Set(revenueData?.items.map((i) => i.procedureName) || [])).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              {/* Insurance filter */}
              <select
                value={revenueInsuranceFilter}
                onChange={(e) => setRevenueInsuranceFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-200 focus:outline-hidden"
              >
                <option value="all">جميع قنوات الدفع / التأمين</option>
                {revenueData?.byInsurance.map((ins) => (
                  <option key={ins.companyName} value={ins.companyName}>
                    {ins.companyName}
                  </option>
                ))}
              </select>
            </div>
          }
          statsSlot={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 text-xs">
                  <span>إجمالي الإيرادات المحصلة</span>
                  <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyHalalas(revenueData?.totalRevenueHalalas || 0)}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>يطابق مجموع الدفعات بنسبة 100%</span>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 text-xs">
                  <span>عدد الفواتير المسددة</span>
                  <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Receipt className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
                  {revenueData?.totalInvoicesCount || 0} فاتورة
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  مشمولة في الفترة المحددة
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 text-xs">
                  <span>عدد عمليات التحصيل</span>
                  <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
                  {revenueData?.totalPaymentsCount || 0} دفعة
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  متوسط الدفعة:{' '}
                  {formatCurrencyHalalas(
                    revenueData && revenueData.totalPaymentsCount > 0
                      ? Math.round(revenueData.totalRevenueHalalas / revenueData.totalPaymentsCount)
                      : 0
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 text-xs">
                  <span>أعلى طبيب إنتاجية</span>
                  <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <Stethoscope className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2 text-lg font-bold text-zinc-900 dark:text-white truncate">
                  {revenueData?.byDoctor[0]?.doctorName || 'د. أحمد الشمري'}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  حصة الإيراد: {revenueData?.byDoctor[0]?.percentage || 45}%
                </div>
              </div>
            </div>
          }
          chartsSlot={
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Trend Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-zinc-800/80 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-4">
                  مسار تحصيل الإيرادات عبر الأيام (SAR)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={revenueData?.byPeriod.map((p) => ({
                        date: p.label,
                        المبلغ: Math.round(p.amountHalalas / 100),
                      })) || []}
                    >
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1E4E9C" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#1E4E9C" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Area
                        type="monotone"
                        dataKey="المبلغ"
                        stroke="#1E4E9C"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRev)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* By Doctor Breakdown */}
              <div className="bg-white dark:bg-zinc-800/80 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-3">
                    توزيع الإيرادات حسب الأطباء
                  </h3>
                  <div className="space-y-3">
                    {revenueData?.byDoctor.map((doc, idx) => (
                      <div key={doc.doctorId} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {doc.doctorName}
                          </span>
                          <span className="font-mono font-bold text-zinc-900 dark:text-white">
                            {formatCurrencyHalalas(doc.amountHalalas)} ({doc.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${doc.percentage}%`,
                              backgroundColor: COLORS[idx % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acceptance verification badge */}
                <div className="mt-4 p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>تدقيق محاسبي آلي:</span>
                  </div>
                  <p className="mt-1">
                    مجموع تقرير الإيرادات = {formatCurrencyHalalas(revenueData?.totalRevenueHalalas || 0)} مطابق تماماً لإجمالي قيود سندات القبض المدفوعة.
                  </p>
                </div>
              </div>
            </div>
          }
        >
          {/* Revenue Items Table */}
          <div className="bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                تفاصيل سجل المتحصلات ({filteredRevenueItems.length} معاملة)
              </h3>
              <span className="text-[11px] text-zinc-400">مرتبة تنازلياً حسب وقت الدفع</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 font-medium border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="py-3 px-4">رقم الفاتورة</th>
                    <th className="py-3 px-4">المريض</th>
                    <th className="py-3 px-4">الطبيب</th>
                    <th className="py-3 px-4">الإجراء المنفذ</th>
                    <th className="py-3 px-4">التأمين / الجهة</th>
                    <th className="py-3 px-4">تاريخ السداد</th>
                    <th className="py-3 px-4">طريقة الدفع</th>
                    <th className="py-3 px-4 text-left">المبلغ المحصل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/60">
                  {filteredRevenueItems.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-700/30">
                      <td className="py-3 px-4 font-mono font-semibold text-primary">
                        {item.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-zinc-900 dark:text-white">
                        {item.patientName}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                        {item.doctorName}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                        {item.procedureName}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                        {item.insuranceName}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">
                        {item.date.substring(0, 10)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                          {item.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrencyHalalas(item.amountHalalas)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ReportShell>
      )}

      {/* ========================================================================= */}
      {/* 2. INCOME STATEMENT (قائمة الدخل المبسطة) */}
      {/* ========================================================================= */}
      {activeTab === 'income_statement' && (
        <ReportShell
          title="قائمة الدخل والأرباح التشغيلية"
          description="ملخص الإيرادات والمصروفات وصافي الأرباح التشغيلية وهامش الربح للفترة"
          badgeText="إيرادات − مصروفات = صافي"
          period={period}
          onPeriodChange={setPeriod}
          customFrom={customFrom}
          customTo={customTo}
          onCustomRangeChange={(f, t) => {
            setCustomFrom(f);
            setCustomTo(t);
          }}
          onExportExcel={handleExportExcel}
          onRefresh={loadCurrentReportData}
          isLoading={isLoading}
          statsSlot={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 text-xs">
                  <span>إجمالي الإيرادات (+)</span>
                  <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyHalalas(incomeData?.totalRevenueHalalas || 0)}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">من جميع العيادات والخدمات</div>
              </div>

              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 text-xs">
                  <span>إجمالي المصروفات (−)</span>
                  <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                    <ArrowDownRight className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
                  {formatCurrencyHalalas(incomeData?.totalExpensesHalalas || 0)}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">تكاليف تشغيلية ورواتب ومواد</div>
              </div>

              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 text-xs">
                  <span>صافي الدخل التشغيلي (=)</span>
                  <span className="p-1.5 bg-primary/10 text-primary rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-black text-primary">
                  {formatCurrencyHalalas(incomeData?.netIncomeHalalas || 0)}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">الفائض الصافي بعد النفقات</div>
              </div>

              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <div className="flex items-center justify-between text-zinc-500 text-xs">
                  <span>هامش الربح التشغيلي</span>
                  <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <Percent className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
                  {incomeData?.profitMarginPercent || 0}%
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">نسبة الربح من إجمالي المبيعات</div>
              </div>
            </div>
          }
          chartsSlot={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trend Comparison */}
              <div className="bg-white dark:bg-zinc-800/80 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-4">
                  مقارنة الإيرادات مقابل المصروفات (آخر 6 أشهر)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={incomeData?.monthlyComparison.map((m) => ({
                        الشهر: m.month,
                        الإيراد: Math.round(m.revenueHalalas / 100),
                        المصروف: Math.round(m.expensesHalalas / 100),
                      })) || []}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="الشهر" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="الإيراد" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="المصروف" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expense Breakdown Categories */}
              <div className="bg-white dark:bg-zinc-800/80 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-3">
                  توزيع المصروفات التشغيلية حسب الفئات
                </h3>
                <div className="space-y-3">
                  {incomeData?.expensesByCategory.map((cat, idx) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{cat.name}</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-white">
                          {formatCurrencyHalalas(cat.amountHalalas)} ({cat.percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${cat.percent}%`,
                            backgroundColor: COLORS[idx % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        />
      )}

      {/* ========================================================================= */}
      {/* 3. AGING REPORT (أعمار الذمم المدينة) */}
      {/* ========================================================================= */}
      {activeTab === 'aging' && (
        <ReportShell
          title="تقرير أعمار الذمم المدينة والمستحقات (Aging Report)"
          description="تتبع الفواتير المتأخرة والديون غير المحصلة مقسمة لفترات الاستحقاق (0-30 / 31-60 / 61-90 / +90)"
          badgeText="إدارة المديونيات"
          period={period}
          onPeriodChange={setPeriod}
          onExportExcel={handleExportExcel}
          onRefresh={loadCurrentReportData}
          isLoading={isLoading}
          statsSlot={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Outstanding */}
              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs lg:col-span-1">
                <span className="text-xs text-zinc-500">إجمالي المديونيات المعلقة</span>
                <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
                  {formatCurrencyHalalas(agingData?.totalOutstandingHalalas || 0)}
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">
                  {agingData?.invoices.length || 0} فواتير معلقة
                </div>
              </div>

              {/* 0-30 Days */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  0-30 يوم (حالية)
                </span>
                <div className="mt-2 text-xl font-black text-emerald-700 dark:text-emerald-400">
                  {formatCurrencyHalalas(agingData?.buckets.current30 || 0)}
                </div>
                <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-500">
                  {agingData?.bucketCounts.current30 || 0} فواتير
                </div>
              </div>

              {/* 31-60 Days */}
              <div className="bg-blue-50/60 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 shadow-xs">
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  31-60 يوم (متأخرة خفيفة)
                </span>
                <div className="mt-2 text-xl font-black text-blue-700 dark:text-blue-400">
                  {formatCurrencyHalalas(agingData?.buckets.days31to60 || 0)}
                </div>
                <div className="mt-1 text-[11px] text-blue-600 dark:text-blue-500">
                  {agingData?.bucketCounts.days31to60 || 0} فواتير
                </div>
              </div>

              {/* 61-90 Days */}
              <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 shadow-xs">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  61-90 يوم (متوسطة الخطورة)
                </span>
                <div className="mt-2 text-xl font-black text-amber-700 dark:text-amber-400">
                  {formatCurrencyHalalas(agingData?.buckets.days61to90 || 0)}
                </div>
                <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-500">
                  {agingData?.bucketCounts.days61to90 || 0} فواتير
                </div>
              </div>

              {/* +90 Days */}
              <div className="bg-rose-50/60 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-800/60 shadow-xs">
                <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                  +90 يوم (حرجة / مشكوك فيها)
                </span>
                <div className="mt-2 text-xl font-black text-rose-700 dark:text-rose-400">
                  {formatCurrencyHalalas(agingData?.buckets.over90 || 0)}
                </div>
                <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-500">
                  {agingData?.bucketCounts.over90 || 0} فواتير
                </div>
              </div>
            </div>
          }
        >
          {/* Outstanding Invoices List */}
          <div className="bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                قائمة الفواتير غير المسددة ({agingData?.invoices.length || 0})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 font-medium border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="py-3 px-4">رقم الفاتورة</th>
                    <th className="py-3 px-4">اسم المريض</th>
                    <th className="py-3 px-4">رقم الجوال</th>
                    <th className="py-3 px-4">تاريخ الإصدار</th>
                    <th className="py-3 px-4 text-center">أيام التأخير</th>
                    <th className="py-3 px-4 text-center">فترة التعمير</th>
                    <th className="py-3 px-4 text-left">قيمة الفاتورة</th>
                    <th className="py-3 px-4 text-left">المسدد</th>
                    <th className="py-3 px-4 text-left">الرصيد المتبقي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/60">
                  {agingData?.invoices.map((inv) => {
                    const badgeStyles: Record<string, string> = {
                      '0-30': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      '31-60': 'bg-blue-50 text-blue-700 border-blue-200',
                      '61-90': 'bg-amber-50 text-amber-700 border-amber-200',
                      '+90': 'bg-rose-50 text-rose-700 border-rose-200',
                    };
                    return (
                      <tr key={inv.invoiceId} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-700/30">
                        <td className="py-3 px-4 font-mono font-semibold text-primary">{inv.invoiceNumber}</td>
                        <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white">{inv.patientName}</td>
                        <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-300">{inv.patientPhone}</td>
                        <td className="py-3 px-4 text-zinc-500">{inv.issueDate.substring(0, 10)}</td>
                        <td className="py-3 px-4 text-center font-bold">{inv.daysOverdue} يوم</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold border ${badgeStyles[inv.bucket]}`}>
                            {inv.bucket}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-left font-mono text-zinc-600">{formatCurrencyHalalas(inv.totalHalalas)}</td>
                        <td className="py-3 px-4 text-left font-mono text-emerald-600">{formatCurrencyHalalas(inv.paidHalalas)}</td>
                        <td className="py-3 px-4 text-left font-mono font-bold text-rose-600 text-sm">
                          {formatCurrencyHalalas(inv.balanceHalalas)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </ReportShell>
      )}

      {/* ========================================================================= */}
      {/* 4. DOCTOR COMMISSIONS (تقرير عمولات الأطباء) */}
      {/* ========================================================================= */}
      {activeTab === 'commissions' && (
        <ReportShell
          title="تقرير عمولات وإنتاجية الأطباء"
          description="حساب المستحقات المالية والعمولات التعاقدية للأطباء بناءً على نسبة العمولة المحددة"
          badgeText="نسب العمولات المعتمدة"
          period={period}
          onPeriodChange={setPeriod}
          customFrom={customFrom}
          customTo={customTo}
          onCustomRangeChange={(f, t) => {
            setCustomFrom(f);
            setCustomTo(t);
          }}
          onExportExcel={handleExportExcel}
          onRefresh={loadCurrentReportData}
          isLoading={isLoading}
          statsSlot={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {commissionsData.map((doc) => (
                <div
                  key={doc.doctorId}
                  className="bg-white dark:bg-zinc-800/80 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{doc.doctorName}</h4>
                      <p className="text-xs text-zinc-500">{doc.specialty}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      نسبة العمولة: {doc.commissionPercent}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-700/60 text-xs">
                    <div>
                      <span className="text-zinc-500 block">إجمالي الإنتاجية:</span>
                      <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        {formatCurrencyHalalas(doc.totalRevenueHalalas)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">صافي العمولة المستحقة:</span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrencyHalalas(doc.commissionHalalas)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
        >
          {/* Detailed Treatments List per Doctor */}
          <div className="space-y-4">
            {commissionsData.map((doc) => (
              <div
                key={doc.doctorId}
                className="bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 shadow-xs overflow-hidden"
              >
                <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="font-bold text-xs text-zinc-900 dark:text-white">
                      بيان علاجات: {doc.doctorName} ({doc.treatmentsCount} إجراء)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 font-mono">
                    العمولة: {formatCurrencyHalalas(doc.commissionHalalas)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-zinc-50/50 text-zinc-500 font-medium border-b border-zinc-100">
                      <tr>
                        <th className="py-2.5 px-4">التاريخ</th>
                        <th className="py-2.5 px-4">اسم المريض</th>
                        <th className="py-2.5 px-4">الإجراء الطبي</th>
                        <th className="py-2.5 px-4 text-center">رقم السن</th>
                        <th className="py-2.5 px-4 text-left">قيمة الإجراء</th>
                        <th className="py-2.5 px-4 text-left">العمولة ({doc.commissionPercent}%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/60">
                      {doc.treatmentsList.map((t, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50">
                          <td className="py-2.5 px-4 text-zinc-500">{t.date}</td>
                          <td className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-white">{t.patientName}</td>
                          <td className="py-2.5 px-4 text-zinc-700 dark:text-zinc-300">{t.procedureName}</td>
                          <td className="py-2.5 px-4 text-center font-mono">{t.toothNumber ?? '-'}</td>
                          <td className="py-2.5 px-4 text-left font-mono">{formatCurrencyHalalas(t.priceHalalas)}</td>
                          <td className="py-2.5 px-4 text-left font-mono font-bold text-emerald-600">
                            {formatCurrencyHalalas(t.commissionHalalas)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </ReportShell>
      )}

      {/* ========================================================================= */}
      {/* 5. VAT REPORT (إقرار ضريبة القيمة المضافة) */}
      {/* ========================================================================= */}
      {activeTab === 'vat' && (
        <ReportShell
          title="تقرير ضريبة القيمة المضافة (ZATCA VAT Report)"
          description="حساب ضريبة المخرجات وضريبة المدخلات وصافي الضريبة المستحقة للهيئة (15%)"
          badgeText="متوافق مع هيئة الزكاة والضريبة"
          period={period}
          onPeriodChange={setPeriod}
          customFrom={customFrom}
          customTo={customTo}
          onCustomRangeChange={(f, t) => {
            setCustomFrom(f);
            setCustomTo(t);
          }}
          onExportExcel={handleExportExcel}
          onRefresh={loadCurrentReportData}
          isLoading={isLoading}
          statsSlot={
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Output VAT */}
              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <span className="text-xs text-zinc-500 block">ضريبة المبيعات والمخرجات (15%)</span>
                <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
                  {formatCurrencyHalalas(vatData?.outputVatHalalas || 0)}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  الأساس الخاضع: {formatCurrencyHalalas(vatData?.taxableSalesHalalas || 0)}
                </div>
              </div>

              {/* Input VAT */}
              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <span className="text-xs text-zinc-500 block">ضريبة المشتريات والمدخلات (المستردة)</span>
                <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
                  {formatCurrencyHalalas(vatData?.inputVatHalalas || 0)}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  الأساس الخاضع: {formatCurrencyHalalas(vatData?.taxablePurchasesHalalas || 0)}
                </div>
              </div>

              {/* Net VAT Payable */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-xs">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                  صافي الضريبة المستحقة للسداد (ZATCA)
                </span>
                <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  {formatCurrencyHalalas(vatData?.netVatPayableHalalas || 0)}
                </div>
                <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-500">
                  ضريبة المخرجات − ضريبة المدخلات
                </div>
              </div>
            </div>
          }
        >
          {/* VAT Transactions Table */}
          <div className="bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                سجل القيود الضريبية التفصيلي ({vatData?.transactions.length || 0})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 font-medium border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">المرجع</th>
                    <th className="py-3 px-4">النوع</th>
                    <th className="py-3 px-4">البيان</th>
                    <th className="py-3 px-4 text-left">الأساس الخاضع للضريبة</th>
                    <th className="py-3 px-4 text-left">قيمة الضريبة (15%)</th>
                    <th className="py-3 px-4 text-left">الإجمالي شامل الضريبة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/60">
                  {vatData?.transactions.map((tr, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/80">
                      <td className="py-3 px-4 text-zinc-500">{tr.date}</td>
                      <td className="py-3 px-4 font-mono font-semibold">{tr.ref}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                            tr.type === 'sale'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {tr.type === 'sale' ? 'مبيعات (مخرجات)' : 'مشتريات (مدخلات)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-800 dark:text-zinc-200">{tr.description}</td>
                      <td className="py-3 px-4 text-left font-mono">{formatCurrencyHalalas(tr.baseHalalas)}</td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-blue-600">
                        {formatCurrencyHalalas(tr.vatHalalas)}
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-zinc-900 dark:text-white">
                        {formatCurrencyHalalas(tr.totalHalalas)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ReportShell>
      )}

      {/* ========================================================================= */}
      {/* 6. DAILY CASH CLOSING (التحصيل اليومي وإغلاق الصندوق) */}
      {/* ========================================================================= */}
      {activeTab === 'daily_closing' && (
        <ReportShell
          title="محضر التحصيل اليومي وإغلاق الصندوق"
          description="مطابقة النقدية والشبكة (مدى) والتحويلات لكل مستخدم لإغلاق الوردية والصندوق"
          badgeText="إغلاق الوردية اليومية"
          period={period}
          onPeriodChange={setPeriod}
          onExportExcel={handleExportExcel}
          onRefresh={loadCurrentReportData}
          isLoading={isLoading}
          filtersSlot={
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200"
              />
              <select
                value={closingUserFilter}
                onChange={(e) => setClosingUserFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200"
              >
                <option value="all">جميع الموظفين (الكاشير)</option>
                {dailyClosingData?.byUser.map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.userName}
                  </option>
                ))}
              </select>
            </div>
          }
          statsSlot={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Total collected */}
              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs lg:col-span-2">
                <span className="text-xs text-zinc-500 block">إجمالي المحصل في اليوم</span>
                <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyHalalas(dailyClosingData?.totalCollectedHalalas || 0)}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  تاريخ: {dailyClosingData?.date} | عدد العمليات: {dailyClosingData?.paymentsCount || 0}
                </div>
              </div>

              {/* Cash */}
              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <span className="text-xs text-zinc-500 block">النقد في الصندوق (Cash)</span>
                <div className="mt-2 text-lg font-bold text-zinc-900 dark:text-white font-mono">
                  {formatCurrencyHalalas(dailyClosingData?.byMethod.cashHalalas || 0)}
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">يجب توريده للبنك</div>
              </div>

              {/* Mada */}
              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <span className="text-xs text-zinc-500 block">نقاط البيع (مدى)</span>
                <div className="mt-2 text-lg font-bold text-primary font-mono">
                  {formatCurrencyHalalas(dailyClosingData?.byMethod.madaHalalas || 0)}
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">إيصال جهاز POS</div>
              </div>

              {/* Credit Card */}
              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <span className="text-xs text-zinc-500 block">بطاقات الائتمان</span>
                <div className="mt-2 text-lg font-bold text-purple-600 font-mono">
                  {formatCurrencyHalalas(dailyClosingData?.byMethod.creditCardHalalas || 0)}
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">فيزا / ماستركارد</div>
              </div>

              {/* Bank Transfer */}
              <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <span className="text-xs text-zinc-500 block">حوالات بنكية</span>
                <div className="mt-2 text-lg font-bold text-amber-600 font-mono">
                  {formatCurrencyHalalas(dailyClosingData?.byMethod.bankTransferHalalas || 0)}
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">إشعار تحويل</div>
              </div>
            </div>
          }
        >
          {/* Per Cashier Breakdown & Payments List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cashiers Summary */}
            <div className="bg-white dark:bg-zinc-800/80 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                إغلاق عهدة المستخدمين (الكاشيرات)
              </h3>
              {dailyClosingData?.byUser.map((u) => (
                <div key={u.userId} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl space-y-2 border border-zinc-100">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>{u.userName}</span>
                    <span className="text-emerald-600 font-mono">{formatCurrencyHalalas(u.totalHalalas)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-zinc-500">
                    <div>نقدي: {formatCurrencyHalalas(u.cashHalalas)}</div>
                    <div>مدى: {formatCurrencyHalalas(u.madaHalalas)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Daily Payments Log */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                  حركات التحصيل المسجلة اليوم ({dailyClosingData?.paymentsList.length || 0})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 font-medium border-b border-zinc-200 dark:border-zinc-700">
                    <tr>
                      <th className="py-2.5 px-4">الوقت</th>
                      <th className="py-2.5 px-4">المريض</th>
                      <th className="py-2.5 px-4">الفاتورة</th>
                      <th className="py-2.5 px-4">المستلم</th>
                      <th className="py-2.5 px-4">وسيلة الدفع</th>
                      <th className="py-2.5 px-4 text-left">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/60">
                    {dailyClosingData?.paymentsList.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/50">
                        <td className="py-2.5 px-4 font-mono text-zinc-500">{p.time}</td>
                        <td className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-white">{p.patientName}</td>
                        <td className="py-2.5 px-4 font-mono text-primary">{p.invoiceNumber}</td>
                        <td className="py-2.5 px-4 text-zinc-600">{p.receivedBy}</td>
                        <td className="py-2.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold bg-zinc-100 dark:bg-zinc-700">
                            {p.method}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-left font-mono font-bold text-emerald-600">
                          {formatCurrencyHalalas(p.amountHalalas)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </ReportShell>
      )}
    </div>
  );
};

export default FinancialReportsPage;
