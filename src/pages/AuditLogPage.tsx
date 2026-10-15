import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDateAr } from '@/lib/formatters';
import {
  ShieldCheck,
  Eye,
  Clock,
  FileSearch,
  Download,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { AuditLog } from '@shared/contracts';

export const AuditLogPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [page, setPage] = useState(1);
  const limit = 25;
  const [isExporting, setIsExporting] = useState(false);

  // Selected Log for Diff Modal
  const [selectedLog, setSelectedLog] = useState<(AuditLog & { user_name?: string }) | null>(null);

  // Fetch users for user filter
  const { data: staffList = [] } = useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: async () => {
      const res = await api.staff.list({ page: 1, limit: 100 });
      return res.ok ? res.data.items : [];
    },
  });

  // Calculate date range for period filter
  const getDateRange = (): { from?: string; to?: string } => {
    const now = new Date();
    if (periodFilter === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      return { from: start, to: now.toISOString() };
    }
    if (periodFilter === 'week') {
      const start = new Date(now.getTime() - 7 * 86400000).toISOString();
      return { from: start, to: now.toISOString() };
    }
    if (periodFilter === 'month') {
      const start = new Date(now.getTime() - 30 * 86400000).toISOString();
      return { from: start, to: now.toISOString() };
    }
    return {};
  };

  const { from, to } = getDateRange();

  // Fetch Audit Logs
  const { data: auditResponse, isLoading } = useQuery({
    queryKey: [
      ...queryKeys.auditLogs.all,
      search,
      userFilter,
      entityFilter,
      actionFilter,
      periodFilter,
      page,
    ],
    queryFn: async () => {
      const res = await api.auditLogs.list({
        search: search.trim() || undefined,
        user_id: userFilter !== 'all' ? userFilter : undefined,
        entity_type: entityFilter !== 'all' ? entityFilter : undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        from,
        to,
        page,
        limit,
      });
      if (res.ok) {
        return res.data;
      }
      return { items: [], total: 0, page: 1, limit: 25, totalPages: 1 };
    },
  });

  const auditData = auditResponse?.items || [];
  const totalPages = auditResponse?.totalPages || 1;
  const totalRecords = auditResponse?.total || 0;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const res = await api.auditLogs.export({
        search: search.trim() || undefined,
        user_id: userFilter !== 'all' ? userFilter : undefined,
        entity_type: entityFilter !== 'all' ? entityFilter : undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        from,
        to,
      });
      if (res.ok && res.data) {
        const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export audit logs:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('LOGIN_SUCCESS')) {
      return <Badge variant="ok">{action}</Badge>;
    }
    if (act.includes('UPDATE') || act.includes('EDIT')) {
      return <Badge variant="primary">{action}</Badge>;
    }
    if (act.includes('DELETE') || act.includes('VOID') || act.includes('BLOCKED')) {
      return <Badge variant="danger">{action}</Badge>;
    }
    if (act.includes('LOCK') || act.includes('FAIL')) {
      return <Badge variant="warning">{action}</Badge>;
    }
    return <Badge variant="neutral">{action}</Badge>;
  };

  const formatEntityName = (entity: string) => {
    const map: Record<string, string> = {
      patients: 'ملفات المرضى',
      invoices: 'الفواتير المالية',
      insurance_claim: 'مطالبات التأمين',
      treatments: 'الإجراءات السريرية',
      inventory: 'المستودع والمخزون',
      leave_request: 'طلبات الإجازة',
      rbac: 'مصفوفة الصلاحيات',
      security_policies: 'سياسات الأمان',
      auth: 'جلسات الدخول والأمان',
      user: 'حسابات الموظفين',
    };
    return map[entity] || entity;
  };

  // Helper to compute diff keys between before and after
  const getDiffKeys = (before: Record<string, unknown> | null, after: Record<string, unknown> | null) => {
    const keys = new Set<string>();
    if (before) Object.keys(before).forEach((k) => keys.add(k));
    if (after) Object.keys(after).forEach((k) => keys.add(k));
    return Array.from(keys);
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none" dir="rtl">
      {/* Header */}
      <PageHeader
        title="سجل التدقيق والرقابة الأمني (Audit Log)"
        description="سجل رقمي غير قابل للتعديل أو الحذف لتوثيق جميع العمليات والأذونات والحركات في النظام"
      >
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2 text-xs font-medium bg-white hover:bg-slate-50"
          >
            <Download className="w-4 h-4 text-brand-blue" />
            <span>{isExporting ? 'جاري التصدير...' : 'تصدير السجل (CSV)'}</span>
          </Button>
          <div className="flex items-center gap-2 text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-brand-blue" />
            <span>سجل محمي وغير قابل للحذف نهائياً</span>
          </div>
        </div>
      </PageHeader>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="بحث في العمليات، الكيانات، أو تفاصيل التغييرات..."
              className="w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* User Filter */}
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="h-10 text-xs px-3 bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20 w-44"
            >
              <option value="all">كل الموظفين والمستخدمين</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.full_name} ({st.role})
                </option>
              ))}
            </select>

            {/* Entity Filter */}
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="h-10 text-xs px-3 bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20 w-36"
            >
              <option value="all">كل الكيانات</option>
              <option value="patients">المرضى</option>
              <option value="invoices">الفواتير</option>
              <option value="treatments">العلاجات</option>
              <option value="inventory">المستودع</option>
              <option value="auth">تسجيل الدخول</option>
              <option value="rbac">الصلاحيات</option>
              <option value="leave_request">الإجازات</option>
            </select>

            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-10 text-xs px-3 bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20 w-36"
            >
              <option value="all">كل الإجراءات</option>
              <option value="LOGIN">تسجيل دخول</option>
              <option value="CREATE">إنشاء وإضافة</option>
              <option value="UPDATE">تعديل وتحديث</option>
              <option value="DELETE">حذف أو إلغاء</option>
              <option value="BLOCKED">عمليات محجوبة</option>
              <option value="LOCK">قفل الحساب</option>
            </select>

            {/* Period Filter */}
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="h-10 text-xs px-3 bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20 w-32"
            >
              <option value="all">كل الفترات</option>
              <option value="today">اليوم</option>
              <option value="week">آخر 7 أيام</option>
              <option value="month">آخر 30 يوماً</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-text-secondary border-b border-border font-bold">
              <tr>
                <th className="py-3.5 px-4">التاريخ والوقت</th>
                <th className="py-3.5 px-4">المستخدم المنفذ</th>
                <th className="py-3.5 px-4">نوع العملية</th>
                <th className="py-3.5 px-4">الكيان المتأثر</th>
                <th className="py-3.5 px-4">ملخص التغيير</th>
                <th className="py-3.5 px-4 text-center">عرض الفرق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    جاري تحميل سجل التدقيق الأمني...
                  </td>
                </tr>
              ) : !auditData || auditData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    لا توجد سجلات تطابق الفلاتر المحددة.
                  </td>
                </tr>
              ) : (
                auditData.map((log) => {
                  const hasDiff = !!(log.before || log.after);
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-text-primary font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-text-muted" />
                          <span>{formatDateAr(log.created_at)}</span>
                          <span className="text-text-muted">
                            {new Date(log.created_at).toLocaleTimeString('ar-SA', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center text-[10px] font-bold">
                            {(log.user_name || 'U').substring(0, 1)}
                          </div>
                          <span className="font-bold text-text-primary">
                            {log.user_name || 'النظام'}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Entity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {formatEntityName(log.entity_type)}
                        </span>
                      </td>

                      {/* Summary */}
                      <td className="py-3.5 px-4 max-w-xs truncate text-text-secondary text-[11px]">
                        {log.after ? (
                          <span className="font-mono">{JSON.stringify(log.after)}</span>
                        ) : log.before ? (
                          <span className="font-mono text-status-danger-fg">
                            حذف: {JSON.stringify(log.before)}
                          </span>
                        ) : (
                          <span className="text-text-muted">لا توجد بيانات إضافية</span>
                        )}
                      </td>

                      {/* View Diff Button */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Button
                          size="sm"
                          variant={hasDiff ? "secondary" : "ghost"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="h-8 px-2.5 text-xs text-brand-blue gap-1 hover:bg-brand-blue/10"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{hasDiff ? 'مقارنة (Diff)' : 'عرض'}</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 border-t border-border text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span>إجمالي السجلات:</span>
            <span className="font-bold text-text-primary">{totalRecords}</span>
            <span className="text-text-muted">|</span>
            <span>الصفحة {page} من {totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>السابق</span>
            </Button>
            <div className="px-2 font-mono font-bold text-text-primary text-xs">
              {page}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <span>التالي</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Diff Viewer Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="تفاصيل السجل والمقارنة (Before / After)"
          className="max-w-2xl"
        >
          <div className="space-y-4 text-xs" dir="rtl">
            {/* Meta Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-border">
              <div>
                <span className="text-text-muted block text-[10px]">المستخدم</span>
                <span className="font-bold text-text-primary">{selectedLog.user_name || 'النظام'}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">العملية</span>
                <span className="font-mono font-bold text-brand-navy">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">الكيان</span>
                <span className="font-bold text-text-primary">{formatEntityName(selectedLog.entity_type)}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">عنوان IP</span>
                <span className="font-mono text-text-secondary">{selectedLog.ip || '127.0.0.1'}</span>
              </div>
            </div>

            {/* Before vs After Table */}
            <div>
              <h4 className="font-bold text-text-primary mb-2 flex items-center gap-1.5">
                <FileSearch className="w-4 h-4 text-brand-blue" />
                <span>مقارنة التغييرات (الحقول المعدلة)</span>
              </h4>

              {selectedLog.before || selectedLog.after ? (
                <div className="border border-border rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-text-secondary border-b border-border font-bold">
                      <tr>
                        <th className="py-2.5 px-3 w-1/3">الحقل (Field)</th>
                        <th className="py-2.5 px-3 w-1/3 text-status-danger-fg">قبل التعديل (Before)</th>
                        <th className="py-2.5 px-3 w-1/3 text-status-ok-fg">بعد التعديل (After)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {getDiffKeys(selectedLog.before, selectedLog.after).map((key) => {
                        const beforeVal = selectedLog.before ? (selectedLog.before as any)[key] : null;
                        const afterVal = selectedLog.after ? (selectedLog.after as any)[key] : null;
                        const isChanged = JSON.stringify(beforeVal) !== JSON.stringify(afterVal);

                        return (
                          <tr key={key} className={isChanged ? 'bg-amber-50/40' : ''}>
                            <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-text-primary">
                              {key}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-status-danger-fg bg-status-danger-bg/20 break-all">
                              {beforeVal !== undefined ? JSON.stringify(beforeVal) : <span className="text-text-muted italic">لا يوجد</span>}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-status-ok-fg bg-status-ok-bg/20 break-all">
                              {afterVal !== undefined ? JSON.stringify(afterVal) : <span className="text-text-muted italic">لا يوجد</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-text-muted bg-slate-50 rounded-xl border border-dashed border-border">
                  لا توجد حقول مسجلة قبل أو بعد هذه العملية.
                </div>
              )}
            </div>

            {/* Raw JSON viewer */}
            <details className="p-3 bg-slate-50 rounded-xl border border-border text-[11px]">
              <summary className="cursor-pointer font-bold text-text-secondary hover:text-text-primary">
                عرض الكائن البرمجي الكامل (Raw JSON)
              </summary>
              <pre className="mt-2 p-3 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto text-[10px] font-mono leading-relaxed" dir="ltr">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </details>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                إغلاق
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AuditLogPage;
