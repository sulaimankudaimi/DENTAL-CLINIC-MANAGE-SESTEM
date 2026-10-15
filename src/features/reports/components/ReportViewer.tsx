import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { ReportDefinition, ReportGeneratedData } from '../types/reportsHub';

interface ReportViewerProps {
  report: ReportDefinition;
  data: ReportGeneratedData;
  searchQuery?: string;
}

const PIE_COLORS = ['#1E4E9C', '#2BB39A', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#10B981'];

export const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  data,
  searchQuery = '',
}) => {
  const [chartMode, setChartMode] = useState<'bar' | 'area' | 'line' | 'pie'>(report.chartType);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter rows by search query
  const filteredRows = data.tableRows.filter((row) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(row).some((val) =>
      String(val || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* 1. Summary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {data.kpis.map((kpi) => (
          <div
            key={kpi.id}
            className="p-4 bg-white rounded-2xl border border-border shadow-xs hover:border-brand-blue/30 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-text-secondary font-medium mb-1">
              <span>{kpi.title}</span>
              {kpi.changePercent !== undefined && (
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                    kpi.changePercent >= 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {kpi.changePercent >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{kpi.changePercent > 0 ? `+${kpi.changePercent}%` : `${kpi.changePercent}%`}</span>
                </span>
              )}
            </div>

            <div className="my-1.5">
              <span className="text-xl lg:text-2xl font-black text-text-primary tracking-tight font-mono">
                {kpi.value}
              </span>
            </div>

            {kpi.subtitle && (
              <div className="text-[11px] text-text-muted flex items-center gap-1 mt-1">
                <span>{kpi.subtitle}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 2. Interactive Chart Container */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-border/60">
          <div>
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-blue" />
              <span>الرسم البياني التحليلي</span>
            </h2>
            <p className="text-[11px] text-text-muted mt-0.5">
              توزيع بياني مرئي للبيانات والمؤشرات الرئيسية
            </p>
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setChartMode('bar')}
              className={`p-1.5 rounded-lg transition-colors ${
                chartMode === 'bar' ? 'bg-white text-brand-blue font-bold shadow-xs' : 'text-text-muted hover:text-text-primary'
              }`}
              title="مخطط أعمدة (Bar)"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setChartMode('area')}
              className={`p-1.5 rounded-lg transition-colors ${
                chartMode === 'area' ? 'bg-white text-brand-blue font-bold shadow-xs' : 'text-text-muted hover:text-text-primary'
              }`}
              title="مخطط مساحي (Area)"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setChartMode('line')}
              className={`p-1.5 rounded-lg transition-colors ${
                chartMode === 'line' ? 'bg-white text-brand-blue font-bold shadow-xs' : 'text-text-muted hover:text-text-primary'
              }`}
              title="مخطط خطي (Line)"
            >
              <LineChartIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setChartMode('pie')}
              className={`p-1.5 rounded-lg transition-colors ${
                chartMode === 'pie' ? 'bg-white text-brand-blue font-bold shadow-xs' : 'text-text-muted hover:text-text-primary'
              }`}
              title="مخطط دائري (Donut/Pie)"
            >
              <PieChartIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recharts Render Area */}
        <div className="h-72 w-full pt-2" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'pie' ? (
              <PieChart>
                <RechartsTooltip
                  formatter={(value: any, name: any) => [`${value}`, name]}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    direction: 'rtl',
                    textAlign: 'right',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-slate-700 font-medium">{value}</span>}
                />
                <Pie
                  data={data.chartData}
                  dataKey={report.chartYKeys[0]?.key || 'count'}
                  nameKey={report.chartXKey}
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={50}
                  paddingAngle={3}
                  label={({ name, percent }: any) => `${name || ''}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill || PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            ) : chartMode === 'area' ? (
              <AreaChart data={data.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <defs>
                  {report.chartYKeys.map((yk) => (
                    <linearGradient key={yk.key} id={`grad-${yk.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={yk.color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={yk.color} stopOpacity={0.0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey={report.chartXKey} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    direction: 'rtl',
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                {report.chartYKeys.map((yk) => (
                  <Area
                    key={yk.key}
                    type="monotone"
                    dataKey={yk.key}
                    name={yk.name}
                    stroke={yk.color}
                    fillOpacity={1}
                    fill={`url(#grad-${yk.key})`}
                    strokeWidth={2.5}
                  />
                ))}
              </AreaChart>
            ) : chartMode === 'line' ? (
              <LineChart data={data.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey={report.chartXKey} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    direction: 'rtl',
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                {report.chartYKeys.map((yk) => (
                  <Line
                    key={yk.key}
                    type="monotone"
                    dataKey={yk.key}
                    name={yk.name}
                    stroke={yk.color}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={data.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey={report.chartXKey} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    direction: 'rtl',
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                {report.chartYKeys.map((yk) => (
                  <Bar
                    key={yk.key}
                    dataKey={yk.key}
                    name={yk.name}
                    fill={yk.color}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Detailed Data Table */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-text-primary">جدول البيانات المفصل</h3>
            <p className="text-[11px] text-text-muted">
              إجمالي السجلات: {filteredRows.length} سجل
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-text-secondary border-b border-border font-bold">
              <tr>
                {data.tableColumns.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`py-3 px-4 ${col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left' : 'text-right'}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={data.tableColumns.length}
                    className="py-12 text-center text-text-muted"
                  >
                    لا توجد بيانات تطابق الفلاتر المحددة حالياً.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {data.tableColumns.map((col) => {
                      const val = row[col.key];
                      return (
                        <td
                          key={col.key}
                          className={`py-3 px-4 whitespace-nowrap text-text-primary ${
                            col.align === 'center'
                              ? 'text-center'
                              : col.align === 'left'
                              ? 'text-left font-mono'
                              : 'text-right'
                          }`}
                        >
                          {col.render ? (
                            col.render(row)
                          ) : typeof val === 'number' ? (
                            <span className="font-mono">{val.toLocaleString('ar-SA')}</span>
                          ) : (
                            val ?? '-'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between text-xs text-text-secondary bg-slate-50/50">
            <span>
              عرض الصفحة {currentPage} من {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-border bg-white disabled:opacity-40 hover:bg-slate-50 font-medium"
              >
                السابق
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-border bg-white disabled:opacity-40 hover:bg-slate-50 font-medium"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Clinical / Financial Insights Note */}
      {data.summaryNote && (
        <div className="p-4 bg-brand-blue/5 border border-brand-blue/20 rounded-2xl flex items-start gap-3 text-xs text-text-primary">
          <Sparkles className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-brand-navy mb-0.5">ملاحظة تحليلية ذكية:</h4>
            <p className="text-text-secondary leading-relaxed">{data.summaryNote}</p>
          </div>
        </div>
      )}
    </div>
  );
};
