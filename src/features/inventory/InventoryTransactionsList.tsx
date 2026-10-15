import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Trash2,
  Plus,
  Calendar,
  Layers,
} from 'lucide-react';
import type { InventoryTransactionType } from '@shared/contracts';

interface InventoryTransactionsListProps {
  onNewTransaction: (type?: InventoryTransactionType) => void;
}

export const InventoryTransactionsList: React.FC<InventoryTransactionsListProps> = ({
  onNewTransaction,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: [...queryKeys.inventory.transactions({ search, type: typeFilter })],
    queryFn: async () => {
      const res = await api.inventory.getTransactions({
        type: typeFilter !== 'all' ? (typeFilter as InventoryTransactionType) : undefined,
        limit: 200,
      });
      return res?.ok ? res.data : [];
    },
  });

  const filtered = transactions.filter((tx) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      tx.item_name?.toLowerCase().includes(q) ||
      tx.item_sku?.toLowerCase().includes(q) ||
      tx.reason?.toLowerCase().includes(q) ||
      tx.created_by_name?.toLowerCase().includes(q)
    );
  });

  // Calculate statistics
  const countIn = transactions.filter((t) => t.type === 'in').length;
  const countOut = transactions.filter((t) => t.type === 'out').length;
  const countAdjust = transactions.filter((t) => t.type === 'adjust').length;
  const countWaste = transactions.filter((t) => t.type === 'waste').length;

  const renderTypeBadge = (type: InventoryTransactionType) => {
    switch (type) {
      case 'in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-600" />
            إدخال / توريد
          </span>
        );
      case 'out':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-brand-navy/10 text-brand-navy border border-brand-navy/20">
            <ArrowUpCircle className="w-3.5 h-3.5 text-brand-navy" />
            صرف سريري
          </span>
        );
      case 'adjust':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            تسوية جردية
          </span>
        );
      case 'waste':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            تالف / منتهي
          </span>
        );
      default:
        return <span>{type}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">حركات التوريد (إدخال)</span>
            <span className="font-mono text-xl font-bold text-emerald-700">{countIn}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ArrowDownCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">حركات الصرف السريري</span>
            <span className="font-mono text-xl font-bold text-brand-navy">{countOut}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-brand-navy/10 flex items-center justify-center text-brand-navy">
            <ArrowUpCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">تسويات المطابقة</span>
            <span className="font-mono text-xl font-bold text-blue-700">{countAdjust}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">المواد التالفة / الهالكة</span>
            <span className="font-mono text-xl font-bold text-rose-700">{countWaste}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <Trash2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="w-64">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المادة، الرمز، أو البيان..."
            />
          </div>

          <div className="w-48">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { label: 'جميع أنواع الحركات', value: 'all' },
                { label: 'إدخال / توريد (+)', value: 'in' },
                { label: 'صرف للعيادة (-)', value: 'out' },
                { label: 'تسوية جردية (=)', value: 'adjust' },
                { label: 'تالف / منتهي (-)', value: 'waste' },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowDownCircle className="w-3.5 h-3.5 text-emerald-600" />}
            onClick={() => onNewTransaction('in')}
          >
            إدخال وتوريد
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={<ArrowUpCircle className="w-3.5 h-3.5 text-brand-navy" />}
            onClick={() => onNewTransaction('out')}
          >
            صرف مواد
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => onNewTransaction('out')}
          >
            تسجيل حركة جديدة
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">جاري تحميل سجل الحركات...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            لا توجد حركات مخزنية مسجلة مطابقة للبحث
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                <tr>
                  <th className="p-3.5">التاريخ والوقت</th>
                  <th className="p-3.5">نوع الحركة</th>
                  <th className="p-3.5">المادة / الصنف</th>
                  <th className="p-3.5 text-center">الكمية</th>
                  <th className="p-3.5">البيان والسبب</th>
                  <th className="p-3.5">الإجراء المرتبط</th>
                  <th className="p-3.5">المنفذ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => {
                  const isPositive = tx.type === 'in';
                  const isNegative = tx.type === 'out' || tx.type === 'waste';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(tx.created_at).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(tx.created_at).toLocaleTimeString('ar-SA', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">{renderTypeBadge(tx.type)}</td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{tx.item_name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{tx.item_sku}</div>
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold text-sm">
                        <span
                          className={
                            isPositive
                              ? 'text-emerald-700'
                              : isNegative
                              ? 'text-rose-600'
                              : 'text-blue-700'
                          }
                        >
                          {isPositive ? `+${tx.quantity}` : isNegative ? `-${tx.quantity}` : `=${tx.quantity}`}
                        </span>{' '}
                        <span className="text-[11px] font-normal text-slate-500">{tx.item_unit}</span>
                      </td>

                      <td className="p-3.5 text-slate-700 max-w-xs">{tx.reason || '—'}</td>

                      <td className="p-3.5">
                        {tx.treatment_title ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-navy bg-brand-navy/5 px-2 py-0.5 rounded border border-brand-navy/20">
                            <Layers className="w-3 h-3" />
                            {tx.treatment_title}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-600 font-medium">
                        {tx.created_by_name || 'طاقم العيادة'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
