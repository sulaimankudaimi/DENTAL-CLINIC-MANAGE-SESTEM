import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  Printer,
  Calendar,
  Layers,
  Package,
} from 'lucide-react';

export const MonthlyConsumptionReport: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonthNum = String(new Date().getMonth() + 1).padStart(2, '0');
  const [selectedMonth, setSelectedMonth] = useState<string>(`${currentYear}-${currentMonthNum}`);

  const { data: report, isLoading } = useQuery({
    queryKey: queryKeys.inventory.monthlyReport(selectedMonth),
    queryFn: async () => {
      const res = await api.inventory.getMonthlyConsumptionReport(selectedMonth);
      return res?.ok ? res.data : null;
    },
  });

  const monthOptions = [
    { label: 'سبتمبر 2026 (الشهر الحالي)', value: '2026-09' },
    { label: 'أغسطس 2026', value: '2026-08' },
    { label: 'يوليو 2026', value: '2026-07' },
    { label: 'يونيو 2026', value: '2026-06' },
    { label: 'مايو 2026', value: '2026-05' },
    { label: 'أبريل 2026', value: '2026-04' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Selector & Actions Bar (Hidden on print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-navy" />
            <span className="font-bold text-slate-800">اختر شهر التقرير:</span>
          </div>
          <div className="w-56">
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              options={monthOptions}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            طباعة التقرير الشهري
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 text-center text-slate-500 rounded-xl border border-slate-200">
          جاري إعداد تقرير الاستهلاك الشهري...
        </div>
      ) : !report ? (
        <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
          لا توجد بيانات استهلاك مسجلة لهذا الشهر
        </div>
      ) : (
        <div className="space-y-6">
          {/* Official Clinic Report Header (Visible on print & screen) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-brand-navy tracking-wider block">
                  عيادات إيادتي لطب وجراحة الأسنان
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  تقرير استهلاك المستودع والمخزون الطبي
                </h2>
                <p className="text-slate-500 text-xs">
                  الفترة الزمنية: <strong className="text-slate-800">{report.monthName}</strong>
                </p>
              </div>

              <div className="text-left font-mono text-[11px] text-slate-500 space-y-0.5">
                <div>تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</div>
                <div>رمز التقرير: REP-INV-{selectedMonth}</div>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">
                  إجمالي قيمة الاستهلاك المالي
                </span>
                <span className="font-mono text-2xl font-bold text-brand-navy block mt-1">
                  {formatCurrency(report.totalConsumedHalalas)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  قيمة المواد المصروفة والتالفة
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">
                  إجمالي حركات الصرف والاستهلاك
                </span>
                <span className="font-mono text-2xl font-bold text-slate-800 block mt-1">
                  {report.totalTransactionsCount}{' '}
                  <span className="text-xs font-normal text-slate-500">حركة صرف</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  مواد مصرفية سريرية + هالك
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">
                  عدد الأصناف المستهلكة الفريدة
                </span>
                <span className="font-mono text-2xl font-bold text-slate-800 block mt-1">
                  {report.totalItemsCount}{' '}
                  <span className="text-xs font-normal text-slate-500">صنف طبي</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  من مختلف التخصصات السنية
                </span>
              </div>
            </div>
          </div>

          {/* Category Distribution Breakdown */}
          {report.byCategory.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-navy" />
                <span>توزيع الاستهلاك المالي حسب الفئات السريرية</span>
              </h3>

              <div className="space-y-3">
                {report.byCategory.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">{cat.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(cat.totalHalalas)}
                        </span>
                        <span className="font-mono font-bold text-brand-navy w-12 text-left">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-brand-navy rounded-full transition-all duration-500"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Consumed Items Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-navy" />
                <span>قائمة أكثر المواد الطبية استهلاكاً خلال هذا الشهر</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="p-3.5">#</th>
                    <th className="p-3.5">اسم المادة / الصنف</th>
                    <th className="p-3.5">التصنيف</th>
                    <th className="p-3.5 text-center">الكمية المصروفة</th>
                    <th className="p-3.5 text-center">سعر التكلفة</th>
                    <th className="p-3.5 text-center">إجمالي تكلفة الصرف</th>
                    <th className="p-3.5 text-center">عدد العمليات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.topConsumedItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        لا توجد حركات استهلاك مسجلة لهذا الشهر
                      </td>
                    </tr>
                  ) : (
                    report.topConsumedItems.map((item, idx) => (
                      <tr key={item.itemId} className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{item.sku}</div>
                        </td>
                        <td className="p-3.5 text-slate-600">{item.category}</td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-900">
                          {item.quantityConsumed} {item.unit}
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-600">
                          {formatCurrency(item.costHalalas)}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-brand-navy text-sm">
                          {formatCurrency(item.totalHalalas)}
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-500">
                          {item.transactionsCount} جلسة / حركة
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
