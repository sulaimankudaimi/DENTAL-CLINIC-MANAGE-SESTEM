import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/formatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { InventoryAlertCards } from '@/features/inventory/InventoryAlertCards';
import { InventoryItemModal } from '@/features/inventory/InventoryItemModal';
import { InventoryTransactionModal } from '@/features/inventory/InventoryTransactionModal';
import { InventoryTransactionsList } from '@/features/inventory/InventoryTransactionsList';
import { ProcedureConsumptionRules } from '@/features/inventory/ProcedureConsumptionRules';
import { SuppliersManager } from '@/features/inventory/SuppliersManager';
import { PurchaseOrdersManager } from '@/features/inventory/PurchaseOrdersManager';
import { MonthlyConsumptionReport } from '@/features/inventory/MonthlyConsumptionReport';
import { INVENTORY_CATEGORIES } from '@/features/inventory/constants';
import type {
  InventoryItem,
  CreateInventoryItem,
  InventoryTransactionType,
  CreateInventoryTransaction,
} from '@shared/contracts';
import {
  Package,
  Plus,
  ArrowUpCircle,
  History,
  Zap,
  Truck,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  Edit2,
  Trash2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useLicenseStore } from '@/store/useLicenseStore';

type InventoryTab = 'items' | 'transactions' | 'procedures' | 'orders' | 'report';

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const isLocked = useLicenseStore((s) => s.isFeatureLocked('inventory'));
  const openActivationDialog = useLicenseStore((s) => s.openActivationDialog);

  // Active Tab
  const [activeTab, setActiveTab] = useState<InventoryTab>('items');

  // Filters for items
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low_stock' | 'expiring_60' | 'expired'>('all');

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txTargetItemId, setTxTargetItemId] = useState<string | null>(null);
  const [txInitialType, setTxInitialType] = useState<InventoryTransactionType>('out');

  // Check URL query parameters for deep linking from dashboard
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    const tabParam = searchParams.get('tab') as InventoryTab | null;

    if (filterParam === 'low_stock') {
      setStatusFilter('low_stock');
      setActiveTab('items');
    } else if (filterParam === 'expiring') {
      setStatusFilter('expiring_60');
      setActiveTab('items');
    }

    if (tabParam && ['items', 'transactions', 'procedures', 'orders', 'report'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Fetch Inventory Items
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: [...queryKeys.inventory.all, search, categoryFilter, statusFilter],
    queryFn: async () => {
      const res = await api.inventory.list({
        search: search.trim() || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: 1,
        limit: 100,
      });
      return res.ok ? res.data.items : [];
    },
  });

  // Fetch Suppliers for selector in item modal
  const { data: suppliers = [] } = useQuery({
    queryKey: queryKeys.inventory.suppliers,
    queryFn: async () => {
      const res = await api.inventory.getSuppliers();
      return res?.ok ? res.data : [];
    },
  });

  const rawItems = inventoryData || [];

  // Mutations
  const createOrUpdateItemMutation = useMutation({
    mutationFn: async (payload: CreateInventoryItem) => {
      if (editingItem) {
        return api.inventory.update(editingItem.id, payload);
      }
      return api.inventory.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lowStock });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todaySummary });
      setIsItemModalOpen(false);
      setEditingItem(null);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.inventory.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lowStock });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todaySummary });
    },
  });

  const recordTxMutation = useMutation({
    mutationFn: async (payload: CreateInventoryTransaction) => {
      return api.inventory.recordTransaction(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lowStock });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todaySummary });
      setIsTxModalOpen(false);
      setTxTargetItemId(null);
    },
  });

  const handleOpenAddItem = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleOpenTx = (itemId?: string, type: InventoryTransactionType = 'out') => {
    setTxTargetItemId(itemId || null);
    setTxInitialType(type);
    setIsTxModalOpen(true);
  };

  // Helper for expiry countdown
  const getExpiryDetails = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const diff = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
    return {
      days: diff,
      isExpired: diff <= 0,
      isExpiringSoon: diff > 0 && diff <= 60,
    };
  };

  return (
    <div className="space-y-6">
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">ميزة المستودع والمخزون الطبي مقفلة في الباقة الحالية</h4>
              <p className="text-xs text-amber-700">تتطلب إدارة المخزون والموردين وأوامر الشراء الترقية إلى الباقة الاحترافية (Pro) أو باقة المنشآت.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openActivationDialog}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            ترقية الباقة الآن
          </button>
        </div>
      )}

      {/* 1. Page Header */}
      <PageHeader
        title="المستودع والمخزون الطبي"
        description="إدارة الأصناف، تتبع الصلاحيات وحدود التنبيه، حركات الصرف والتوريد، والربط التلقائي بالإجراءات السريرية"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              icon={<ArrowUpCircle className="w-4 h-4 text-brand-navy" />}
              onClick={() => handleOpenTx(undefined, 'out')}
            >
              صرف مواد
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddItem}
            >
              إضافة صنف جديد
            </Button>
          </div>
        }
      />

      {/* 2. Top Alert Cards ("3 أصناف قاربت النفاد" و "صنفان قاربا انتهاء الصلاحية") */}
      <InventoryAlertCards
        onFilterLowStock={() => {
          setStatusFilter('low_stock');
          setActiveTab('items');
        }}
        onFilterExpiring={() => {
          setStatusFilter('expiring_60');
          setActiveTab('items');
        }}
      />

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'items'
              ? 'border-brand-navy text-brand-navy'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>الأصناف والمخزون الطبي</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
            {rawItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'border-brand-navy text-brand-navy'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل الحركات (إدخال/صرف/تسوية/تالف)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('procedures')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'procedures'
              ? 'border-brand-navy text-brand-navy'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>ربط مستهلكات الإجراءات المنفّذة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-brand-navy text-brand-navy'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>الموردون وأوامر الشراء</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'report'
              ? 'border-brand-navy text-brand-navy'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>تقرير الاستهلاك الشهري</span>
        </button>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: Items & Catalog */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="w-64">
                <SearchInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث باسم المادة، كود SKU، الرف..."
                />
              </div>

              <div className="w-48">
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  options={[
                    { label: 'جميع التصنيفات السريرية', value: 'all' },
                    ...INVENTORY_CATEGORIES.map((c) => ({ label: c, value: c })),
                  ]}
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('low_stock')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                    statusFilter === 'low_stock'
                      ? 'bg-rose-600 text-white shadow-2xs font-bold'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  قاربت النفاد
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('expiring_60')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                    statusFilter === 'expiring_60'
                      ? 'bg-amber-600 text-white shadow-2xs font-bold'
                      : 'text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  صلاحية &lt; 60 يوم
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('expired')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === 'expired'
                      ? 'bg-slate-800 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  منتهية الصلاحية
                </button>
              </div>
            </div>

            {statusFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="text-slate-500 hover:text-slate-700"
              >
                إلغاء التصفية
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-500">جاري تحميل أصناف المخزون...</div>
            ) : rawItems.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                لا توجد مواد مسجلة مطابقة لمعايير البحث
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                    <tr>
                      <th className="p-3.5">كود SKU</th>
                      <th className="p-3.5">اسم المادة / الصنف</th>
                      <th className="p-3.5">التصنيف</th>
                      <th className="p-3.5 text-center">الكمية المتوفرة</th>
                      <th className="p-3.5 text-center">حد التنبيه</th>
                      <th className="p-3.5 text-center">سعر التكلفة</th>
                      <th className="p-3.5">تاريخ الصلاحية</th>
                      <th className="p-3.5">موقع التخزين</th>
                      <th className="p-3.5 text-center">الإجراءات السريعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rawItems.map((item) => {
                      const isLow = item.quantity <= item.min_quantity;
                      const exp = getExpiryDetails(item.expiry_date);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-brand-navy">{item.sku}</td>

                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{item.name}</div>
                            {item.location && (
                              <div className="text-[10px] text-slate-400">{item.location}</div>
                            )}
                          </td>

                          <td className="p-3.5 text-slate-600">{item.category}</td>

                          <td className="p-3.5 text-center">
                            <span
                              className={`font-mono font-bold text-sm ${
                                isLow ? 'text-rose-600' : 'text-slate-900'
                              }`}
                            >
                              {item.quantity}
                            </span>{' '}
                            <span className="text-[11px] text-slate-500 font-normal">
                              {item.unit}
                            </span>
                            {isLow && (
                              <span className="block text-[10px] text-rose-600 font-bold">
                                قارب النفاد!
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-center font-mono text-slate-500">
                            {item.min_quantity}
                          </td>

                          <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                            {formatCurrency(item.cost_halalas)}
                          </td>

                          <td className="p-3.5">
                            {exp ? (
                              <div>
                                <span className="font-mono text-slate-700 block">
                                  {item.expiry_date}
                                </span>
                                {exp.isExpired ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-bold">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    منتهي الصلاحية
                                  </span>
                                ) : exp.isExpiringSoon ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 font-bold">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    ينتهي خلال {exp.days} يوم
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-700 font-medium">
                                    صالح ({exp.days} يوم)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="p-3.5 text-slate-500">{item.location || '—'}</td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenTx(item.id, 'out')}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-brand-navy hover:text-white text-slate-700 text-[11px] font-bold transition-colors"
                                title="صرف سريع من هذا الصنف"
                              >
                                صرف
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenTx(item.id, 'in')}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-[11px] font-bold transition-colors"
                                title="إدخال وتوريد لهذا الصنف"
                              >
                                توريد
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditItem(item)}
                                className="p-1 rounded text-slate-400 hover:text-brand-navy hover:bg-slate-100"
                                title="تعديل الصنف"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`هل أنت متأكد من حذف الصنف "${item.name}" من المخزون؟`)) {
                                    deleteItemMutation.mutate(item.id);
                                  }
                                }}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="حذف الصنف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
      )}

      {/* TAB 2: Inventory Transactions Log */}
      {activeTab === 'transactions' && (
        <InventoryTransactionsList
          onNewTransaction={(type) => handleOpenTx(undefined, type || 'out')}
        />
      )}

      {/* TAB 3: Automated Procedure Consumption */}
      {activeTab === 'procedures' && (
        <ProcedureConsumptionRules inventoryItems={rawItems} />
      )}

      {/* TAB 4: Suppliers & Purchase Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-8">
          <PurchaseOrdersManager inventoryItems={rawItems} suppliers={suppliers} />
          <div className="pt-6 border-t border-slate-200">
            <div className="mb-4">
              <h3 className="font-bold text-slate-900 text-sm">دليل الموردين وشركات المستلزمات الطبية</h3>
              <p className="text-[11px] text-slate-500">
                تسجيل بيانات الشركات الموردة، هواتف المندوبين، وشروط السداد
              </p>
            </div>
            <SuppliersManager />
          </div>
        </div>
      )}

      {/* TAB 5: Monthly Consumption Report */}
      {activeTab === 'report' && <MonthlyConsumptionReport />}

      {/* Item Modal (Add/Edit) */}
      <InventoryItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={async (data) => {
          await createOrUpdateItemMutation.mutateAsync(data);
        }}
        item={editingItem}
        suppliers={suppliers}
        isLoading={createOrUpdateItemMutation.isPending}
      />

      {/* Transaction Modal (In/Out/Adjust/Waste) */}
      <InventoryTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setTxTargetItemId(null);
        }}
        onSubmit={async (data) => {
          await recordTxMutation.mutateAsync(data);
        }}
        items={rawItems}
        preselectedItemId={txTargetItemId}
        initialType={txInitialType}
        isLoading={recordTxMutation.isPending}
      />
    </div>
  );
};

export default InventoryPage;
