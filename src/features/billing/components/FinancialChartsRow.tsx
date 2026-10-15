import React from 'react';
import type { FinancialsReportData } from '@shared/contracts';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export interface FinancialChartsRowProps {
  data?: FinancialsReportData | null;
  isLoading?: boolean;
}

export const FinancialChartsRow: React.FC<FinancialChartsRowProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  const { revenueByService, monthlyCashFlow, annualTrend } = data;

  // Custom Tooltip for Recharts
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-800 text-right">
          <p className="font-bold mb-1 text-slate-200">{label}</p>
          <p className="text-emerald-400 font-mono">
            التدفق: {payload[0]?.value?.toLocaleString('ar-SA')} ر.س
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-800 text-right">
          <p className="font-bold mb-1 text-slate-200">{label}</p>
          <p className="text-sky-400 font-mono">
            الإيراد: {payload[0]?.value?.toLocaleString('ar-SA')} ر.س
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Donut Chart - Revenue by Service with Side Legend */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">
            الإيرادات حسب الخدمة (Revenue by Service)
          </h3>
        </div>

        <div className="flex items-center gap-2 h-44">
          <div className="w-1/2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueByService}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={62}
                  paddingAngle={3}
                  dataKey="revenueSAR"
                >
                  {revenueByService.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, _name: any, item: any) => [
                    `${Number(value).toLocaleString('ar-SA')} ر.س (${item.payload.percentage}%)`,
                    item.payload.name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Side Legend matching the mockup */}
          <div className="w-1/2 flex flex-col gap-1.5 overflow-y-auto max-h-40 pr-1 text-[11px]">
            {revenueByService.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate" title={item.name}>{item.name}</span>
                </div>
                <span className="font-bold text-slate-800 shrink-0 font-mono text-[10px]">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Bar Chart - Monthly Cash Flow */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">
            التدفق النقدي الشهري (Monthly Cash Flow)
          </h3>
          <span className="text-[10px] text-slate-400 font-semibold">بالريال السعودي</span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyCashFlow.slice(-6)} // Recent 6 months for clear bar display
              margin={{ top: 8, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="monthKey"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748B', fontSize: 10 }}
              />
              <YAxis
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94A3B8', fontSize: 9 }}
                tickFormatter={(val) => `${Math.round(val / 1000)}k`}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar
                dataKey="cashFlowSAR"
                fill="#1E4E9C"
                radius={[6, 6, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Area Chart - Monthly Cash Flow / Annual Trend */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">
            الإيرادات خلال السنة (Annual Revenue Curve)
          </h3>
          <span className="text-[10px] text-emerald-600 font-semibold font-mono">100% نمو مستقر</span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={annualTrend}
              margin={{ top: 8, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748B', fontSize: 10 }}
              />
              <YAxis
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94A3B8', fontSize: 9 }}
                tickFormatter={(val) => `${Math.round(val / 1000)}k`}
              />
              <Tooltip content={<CustomAreaTooltip />} />
              <Area
                type="monotone"
                dataKey="revenueSAR"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
