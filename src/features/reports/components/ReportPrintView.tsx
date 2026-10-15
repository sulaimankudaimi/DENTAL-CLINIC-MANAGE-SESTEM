import React from 'react';
import type { ReportDefinition, ReportGeneratedData, ReportFilterState } from '../types/reportsHub';

interface ReportPrintViewProps {
  report: ReportDefinition;
  data: ReportGeneratedData;
  filters: ReportFilterState;
}

export const ReportPrintView: React.FC<ReportPrintViewProps> = ({
  report,
  data,
  filters,
}) => {
  const now = new Date();

  return (
    <div className="hidden print:block p-8 bg-white text-black font-sans text-xs">
      {/* Official Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">مجمع عيادتي لطب وزراعة الأسنان</h1>
          <p className="text-xs text-slate-600 mt-0.5">Eyadati Specialized Dental Clinic</p>
          <p className="text-[10px] text-slate-500 mt-1">الرقم الضريبي (VAT): 300000000000003 • هاتف: 920000000 • الرياض</p>
        </div>
        <div className="text-left font-mono text-[11px] text-slate-700 space-y-0.5" dir="ltr">
          <div>Report ID: {report.id.toUpperCase()}</div>
          <div>Date: {now.toISOString().substring(0, 10)} {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          <div>Page 1 of 1</div>
        </div>
      </div>

      {/* Report Info & Scope */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-slate-900">{report.title}</h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-200 text-slate-800 rounded">
            {report.category === 'financial'
              ? 'تقرير مالي'
              : report.category === 'patients'
              ? 'تقرير شؤون المرضى'
              : report.category === 'appointments'
              ? 'تقرير تشغيل المواعيد'
              : 'تقرير سريري'}
          </span>
        </div>
        <p className="text-xs text-slate-600 mb-3">{report.description}</p>

        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-700 pt-2 border-t border-slate-200">
          <div>
            <span className="font-bold text-slate-900">النطاق الزمني: </span>
            <span>{filters.period === 'custom' ? `من ${filters.from} إلى ${filters.to}` : filters.period}</span>
          </div>
          <div>
            <span className="font-bold text-slate-900">الطبيب: </span>
            <span>{filters.doctorId === 'all' ? 'كافة أطباء العيادة' : filters.doctorId}</span>
          </div>
          <div>
            <span className="font-bold text-slate-900">العيادة/الكرسي: </span>
            <span>{filters.roomId === 'all' ? 'كافة العيادات' : filters.roomId}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {data.kpis.map((kpi) => (
          <div key={kpi.id} className="p-3 border border-slate-300 rounded-lg text-center bg-white">
            <div className="text-[10px] text-slate-600 mb-1">{kpi.title}</div>
            <div className="text-sm font-black text-slate-900 font-mono">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <table className="w-full text-right text-[11px] border border-slate-300 mb-6">
        <thead className="bg-slate-100 text-slate-900 border-b border-slate-300 font-bold">
          <tr>
            {data.tableColumns.map((col) => (
              <th
                key={col.key}
                className="py-2 px-3 border-l border-slate-200 last:border-l-0"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {data.tableRows.map((row, idx) => (
            <tr key={idx} className="odd:bg-white even:bg-slate-50/50">
              {data.tableColumns.map((col) => (
                <td
                  key={col.key}
                  className="py-2 px-3 border-l border-slate-200 last:border-l-0 text-slate-800"
                >
                  {row[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signature and Verification Footer */}
      <div className="mt-12 pt-4 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-600">
        <div>
          <span>الموظف المستخرج: </span>
          <span className="font-bold text-slate-900">النظام المكتبي الإلكتروني</span>
        </div>
        <div>
          <span>الختم والاعتماد: </span>
          <span className="inline-block w-32 border-b border-dashed border-slate-400 ms-2"></span>
        </div>
      </div>
    </div>
  );
};
