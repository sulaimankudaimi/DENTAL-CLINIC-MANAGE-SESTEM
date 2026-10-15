import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import type {
  PurchaseOrder,
  PurchaseOrderStatus,
  InventoryItem,
  Supplier,
} from '@shared/contracts';
import {
  Plus,
  Clock,
  XCircle,
  PackageCheck,
  Trash2,
  Eye,
  Send,
} from 'lucide-react';

interface PurchaseOrdersManagerProps {
  inventoryItems: InventoryItem[];
  suppliers: Supplier[];
}

export const PurchaseOrdersManager: React.FC<PurchaseOrdersManagerProps> = ({
  inventoryItems,
  suppliers,
}) => {
  const queryClient = useQueryClient();
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<PurchaseOrder | null>(null);

  // Form states for new PO
  const [supplierId, setSupplierId] = useState<string>('');
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [orderItems, setOrderItems] = useState<
    Array<{ item_id: string; quantity: number; cost_halalas: number }>
  >([
    {
      item_id: inventoryItems[0]?.id || '',
      quantity: 5,
      cost_halalas: inventoryItems[0]?.cost_halalas || 5000,
    },
  ]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: purchaseOrders = [], isLoading } = useQuery({
    queryKey: queryKeys.inventory.purchaseOrders,
    queryFn: async () => {
      const res = await api.inventory.getPurchaseOrders();
      return res?.ok ? res.data : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      supplier_id: string;
      order_date?: string;
      expected_date?: string | null;
      notes?: string | null;
      items: Array<{ item_id: string; quantity: number; cost_halalas: number }>;
    }) => {
      return api.inventory.createPurchaseOrder(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.purchaseOrders });
      setIsNewOrderOpen(false);
      resetForm();
    },
  });

  const receiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.inventory.receivePurchaseOrder(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.purchaseOrders });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todaySummary });
      setSelectedOrderDetails(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PurchaseOrderStatus }) => {
      return api.inventory.updatePurchaseOrderStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.purchaseOrders });
    },
  });

  const resetForm = () => {
    setSupplierId(suppliers[0]?.id || '');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setExpectedDate('');
    setNotes('');
    setOrderItems([
      {
        item_id: inventoryItems[0]?.id || '',
        quantity: 5,
        cost_halalas: inventoryItems[0]?.cost_halalas || 5000,
      },
    ]);
    setErrorMsg(null);
  };

  const handleAddItemRow = () => {
    const nextItem = inventoryItems[orderItems.length % inventoryItems.length] || inventoryItems[0];
    setOrderItems([
      ...orderItems,
      {
        item_id: nextItem?.id || '',
        quantity: 5,
        cost_halalas: nextItem?.cost_halalas || 5000,
      },
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    const updated = [...orderItems];
    if (field === 'item_id') {
      const itm = inventoryItems.find((i) => i.id === val);
      updated[idx] = {
        ...updated[idx],
        item_id: val,
        cost_halalas: itm ? itm.cost_halalas : updated[idx].cost_halalas,
      };
    } else if (field === 'quantity') {
      updated[idx] = { ...updated[idx], quantity: Math.max(1, parseInt(val, 10) || 1) };
    } else if (field === 'cost_halalas') {
      updated[idx] = { ...updated[idx], cost_halalas: Math.max(0, val) };
    }
    setOrderItems(updated);
  };

  const grandTotalHalalas = orderItems.reduce(
    (sum, it) => sum + it.cost_halalas * it.quantity,
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setErrorMsg('يرجى اختيار المورد لأمر الشراء');
      return;
    }
    if (orderItems.length === 0) {
      setErrorMsg('يرجى إضافة صنف واحد على الأقل في أمر الشراء');
      return;
    }

    createMutation.mutate({
      supplier_id: supplierId,
      order_date: orderDate,
      expected_date: expectedDate || null,
      notes: notes.trim() || null,
      items: orderItems,
    });
  };

  const renderStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
            <Clock className="w-3.5 h-3.5" />
            مسودة طلب
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Send className="w-3.5 h-3.5 text-amber-600" />
            تم الإرسال للمورد
          </span>
        );
      case 'received':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
            مستلم ومورّد للمخزون
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            ملغي
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">أوامر الشراء والتوريد للعيادة</h4>
          <p className="text-[11px] text-slate-500">
            إنشاء أوامر شراء مبسطة، إرسالها للموردين، واستلامها بضغطة زر لتحديث الأرصدة تلقائياً
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            resetForm();
            setIsNewOrderOpen(true);
          }}
        >
          إنشاء أمر شراء جديد
        </Button>
      </div>

      {/* Orders List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">جاري تحميل أوامر الشراء...</div>
        ) : purchaseOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            لا توجد أوامر شراء مسجلة حالياً
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                <tr>
                  <th className="p-3.5">رقم الأمر</th>
                  <th className="p-3.5">المورد</th>
                  <th className="p-3.5">تاريخ الطلب</th>
                  <th className="p-3.5">التسليم المتوقع</th>
                  <th className="p-3.5 text-center">عدد الأصناف</th>
                  <th className="p-3.5 text-center">إجمالي التكلفة</th>
                  <th className="p-3.5 text-center">الحالة</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.map((po) => {
                  const isReceived = po.status === 'received';
                  const isDraft = po.status === 'draft';

                  return (
                    <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-brand-navy">
                        {po.po_number}
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{po.supplier_name}</div>
                        {po.notes && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">
                            {po.notes}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 font-mono text-slate-600">
                        {new Date(po.order_date).toLocaleDateString('ar-SA')}
                      </td>

                      <td className="p-3.5 font-mono text-slate-500">
                        {po.expected_date
                          ? new Date(po.expected_date).toLocaleDateString('ar-SA')
                          : '—'}
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                        {po.items.length} أصناف
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(po.total_halalas)}
                      </td>

                      <td className="p-3.5 text-center">{renderStatusBadge(po.status)}</td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(po)}
                            className="p-1.5 text-slate-600 hover:text-brand-navy hover:bg-slate-100 rounded transition-colors"
                            title="عرض تفاصيل الأمر"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isDraft && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateStatusMutation.mutate({ id: po.id, status: 'sent' })
                              }
                            >
                              إرسال للمورد
                            </Button>
                          )}

                          {!isReceived && po.status !== 'cancelled' && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<PackageCheck className="w-3.5 h-3.5" />}
                              onClick={() => {
                                if (
                                  confirm(
                                    `هل تؤكد استلام أمر الشراء ${po.po_number}؟ سيتم إضافة المواد إلى رصيد المستودع فوراً.`
                                  )
                                ) {
                                  receiveMutation.mutate(po.id);
                                }
                              }}
                            >
                              استلام وتوريد
                            </Button>
                          )}
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

      {/* Modal Create Purchase Order */}
      <Modal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        title="إنشاء أمر شراء مبسط جديد"
        description="تحديد المورد، تواريخ التسليم، وإضافة المواد الطبية المطلوبة وسعر التكلفة"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select
              label="المورد *"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              options={suppliers.map((s) => ({ label: s.name, value: s.id }))}
            />

            <Input
              label="تاريخ الطلب *"
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              required
            />

            <Input
              label="تاريخ التسليم المتوقع"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </div>

          {/* Items Selector */}
          <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">بنود المواد المطلوبة:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddItemRow}
              >
                إضافة بند آخر
              </Button>
            </div>

            <div className="space-y-2">
              {orderItems.map((row, idx) => {
                const lineTotalHalalas = row.cost_halalas * row.quantity;

                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200"
                  >
                    <div className="col-span-6">
                      <select
                        value={row.item_id}
                        onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)}
                        className="w-full h-8 px-2 rounded-md border border-slate-300 text-slate-900 bg-white"
                      >
                        {inventoryItems.map((itm) => (
                          <option key={itm.id} value={itm.id}>
                            {itm.name} ({itm.sku}) — {itm.unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full h-8 px-2 text-center rounded-md border border-slate-300 text-slate-900 font-mono font-bold"
                          placeholder="الكمية"
                        />
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={row.cost_halalas / 100}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              'cost_halalas',
                              Math.round(parseFloat(e.target.value || '0') * 100)
                            )
                          }
                          className="w-full h-8 px-2 text-center rounded-md border border-slate-300 text-slate-900 font-mono font-bold"
                          placeholder="سعر الوحدة"
                        />
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center justify-between font-mono font-bold text-slate-900">
                      <span>{formatCurrency(lineTotalHalalas)}</span>
                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-700">إجمالي أمر الشراء التقديري:</span>
              <span className="font-mono text-base font-bold text-brand-navy">
                {formatCurrency(grandTotalHalalas)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">ملاحظات وتعليمات للمورد</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: يرجى التأكد من تاريخ الصلاحية ألا يقل عن سنتين، التوصيل للعيادة خلال الفترة الصباحية..."
              className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsNewOrderOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ أمر الشراء'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal View Details */}
      {selectedOrderDetails && (
        <Modal
          isOpen={!!selectedOrderDetails}
          onClose={() => setSelectedOrderDetails(null)}
          title={`تفاصيل أمر الشراء: ${selectedOrderDetails.po_number}`}
          description={`المورد: ${selectedOrderDetails.supplier_name}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">رقم الأمر</span>
                <span className="font-mono font-bold text-brand-navy">
                  {selectedOrderDetails.po_number}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">تاريخ الطلب</span>
                <span className="font-mono text-slate-700">
                  {new Date(selectedOrderDetails.order_date).toLocaleDateString('ar-SA')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">الحالة الحالية</span>
                <div className="mt-1">{renderStatusBadge(selectedOrderDetails.status)}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">إجمالي القيمة</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {formatCurrency(selectedOrderDetails.total_halalas)}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="p-3">الصنف / المادة</th>
                    <th className="p-3 text-center">الكمية المطلوبة</th>
                    <th className="p-3 text-center">سعر الوحدة</th>
                    <th className="p-3 text-center">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOrderDetails.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-bold text-slate-900">{it.item_name}</td>
                      <td className="p-3 text-center font-mono font-bold">
                        {it.quantity} {it.unit}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {formatCurrency(it.cost_halalas)}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900">
                        {formatCurrency(it.total_halalas)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedOrderDetails.notes && (
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 text-amber-900">
                <span className="font-bold block mb-1">ملاحظات الطلب:</span>
                <p className="text-[11px] leading-relaxed">{selectedOrderDetails.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedOrderDetails(null)}
              >
                إغلاق
              </Button>

              {selectedOrderDetails.status !== 'received' && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PackageCheck className="w-4 h-4" />}
                  onClick={() => {
                    receiveMutation.mutate(selectedOrderDetails.id);
                  }}
                  disabled={receiveMutation.isPending}
                >
                  {receiveMutation.isPending
                    ? 'جاري التوريد للمستودع...'
                    : 'استلام وتوريد للمخزون الآن'}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
