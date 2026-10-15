import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import type { InventoryItem, InventoryTransactionType, CreateInventoryTransaction } from '@shared/contracts';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Package,
} from 'lucide-react';

interface InventoryTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInventoryTransaction) => Promise<void>;
  items: InventoryItem[];
  preselectedItemId?: string | null;
  initialType?: InventoryTransactionType;
  isLoading?: boolean;
}

export const InventoryTransactionModal: React.FC<InventoryTransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  items,
  preselectedItemId,
  initialType = 'out',
  isLoading = false,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [type, setType] = useState<InventoryTransactionType>(initialType);
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedItemId) {
      setSelectedItemId(preselectedItemId);
    } else if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
    }
    setType(initialType);
    setQuantity(1);
    setReason('');
    setErrorMsg(null);
  }, [preselectedItemId, initialType, isOpen, items]);

  const currentItem = items.find((i) => i.id === selectedItemId);

  // Calculate projected balance after movement
  let projectedBalance: number | null = null;
  if (currentItem) {
    if (type === 'in') {
      projectedBalance = currentItem.quantity + quantity;
    } else if (type === 'out' || type === 'waste') {
      projectedBalance = Math.max(0, currentItem.quantity - quantity);
    } else if (type === 'adjust') {
      projectedBalance = quantity;
    }
  }

  const isDeductingMoreThanStock =
    currentItem && (type === 'out' || type === 'waste') && quantity > currentItem.quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      setErrorMsg('يرجى اختيار الصنف');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('يجب أن تكون الكمية أكبر من صفر');
      return;
    }
    if (isDeductingMoreThanStock) {
      setErrorMsg('لا يمكن صرف كمية أكبر من الرصيد المتوفر حالياً بالمستودع');
      return;
    }

    try {
      await onSubmit({
        clinic_id: currentItem?.clinic_id || 'c1000000-0000-0000-0000-000000000001',
        item_id: selectedItemId,
        type,
        quantity,
        reason: reason.trim() || null,
        treatment_id: null,
        created_by: 'u1000000-0000-0000-0000-000000000001',
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تسجيل حركة المخزون');
    }
  };

  const transactionTypes: Array<{
    type: InventoryTransactionType;
    label: string;
    desc: string;
    icon: React.ReactNode;
    colorClass: string;
  }> = [
    {
      type: 'in',
      label: 'إدخال / توريد',
      desc: 'استلام بضاعة جديدة أو إضافة رصيد للمستودع (+)',
      icon: <ArrowDownCircle className="w-5 h-5 text-emerald-600" />,
      colorClass: type === 'in' ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:bg-slate-50',
    },
    {
      type: 'out',
      label: 'صرف للعيادة',
      desc: 'صرف مواد لعيادات الأسنان والاستخدام اليومي (-)',
      icon: <ArrowUpCircle className="w-5 h-5 text-brand-navy" />,
      colorClass: type === 'out' ? 'border-brand-navy bg-brand-navy/5 ring-2 ring-brand-navy/20' : 'border-slate-200 hover:bg-slate-50',
    },
    {
      type: 'adjust',
      label: 'تسوية جردية',
      desc: 'مطابقة الجرد الفعلي مع رصيد النظام (=)',
      icon: <RefreshCw className="w-5 h-5 text-blue-600" />,
      colorClass: type === 'adjust' ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20' : 'border-slate-200 hover:bg-slate-50',
    },
    {
      type: 'waste',
      label: 'تالف / منتهي',
      desc: 'إتلاف مواد منتهية الصلاحية أو مكسورة (-)',
      icon: <Trash2 className="w-5 h-5 text-rose-600" />,
      colorClass: type === 'waste' ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20' : 'border-slate-200 hover:bg-slate-50',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تسجيل حركة مخزون جديدة"
      description="إدخال، صرف سريري، تسوية جردية، أو توثيق تالف وتحديث الرصيد مباشرة"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Select Movement Type */}
        <div className="space-y-2">
          <label className="block font-bold text-slate-700">نوع الحركة المخزنية *</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {transactionTypes.map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => setType(t.type)}
                className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-1.5 ${t.colorClass}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{t.label}</span>
                  {t.icon}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Choose Item */}
        <div className="space-y-1.5">
          <Select
            label="اختر الصنف أو المادة الطبية *"
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            options={items.map((i) => ({
              label: `${i.name} (${i.sku}) — متوفر: ${i.quantity} ${i.unit}`,
              value: i.id,
            }))}
          />
        </div>

        {/* 3. Item Stock Summary Banner */}
        {currentItem && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-bold text-slate-900">{currentItem.name}</p>
                <p className="text-[11px] text-slate-500">
                  {currentItem.category} · موقع التخزين: {currentItem.location || 'غير محدد'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">الرصيد الحالي</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {currentItem.quantity} {currentItem.unit}
                </span>
              </div>
              <div className="text-slate-300 font-bold">➜</div>
              <div>
                <span className="text-[10px] text-slate-400 block">الرصيد المتوقع بعد الحركة</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    projectedBalance !== null && projectedBalance <= currentItem.min_quantity
                      ? 'text-rose-600'
                      : 'text-emerald-700'
                  }`}
                >
                  {projectedBalance} {currentItem.unit}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Quantity and Reason */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              {type === 'adjust' ? 'الرصيد الفعلي بعد التسوية *' : 'الكمية المطلوبة *'}
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className={`w-full h-9 px-3 rounded-lg border text-slate-900 font-mono text-center font-bold focus:outline-hidden focus:ring-2 ${
                  isDeductingMoreThanStock
                    ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-brand-navy/20 focus:border-brand-navy'
                }`}
              />
              <span className="absolute left-3 top-2 text-[11px] text-slate-400 pointer-events-none">
                {currentItem?.unit || 'وحدة'}
              </span>
            </div>
            {isDeductingMoreThanStock && (
              <p className="text-[10px] text-rose-600 font-medium mt-1">
                تنبيه: الكمية المطلوبة تتجاوز المتوفر ({currentItem?.quantity})
              </p>
            )}
          </div>

          <Input
            label="البيان / سبب الحركة *"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              type === 'in'
                ? 'مثال: استلام فاتورة توريد رقم PO-2026-04'
                : type === 'out'
                ? 'مثال: صرف لعيادة الأسنان 1 لجلسات اليوم'
                : type === 'adjust'
                ? 'مثال: مطابقة الجرد الدوري الفعلي'
                : 'مثال: تلف مادة أو انتهاء صلاحية'
            }
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || isDeductingMoreThanStock}
          >
            {isLoading ? 'جاري التسجيل...' : 'تأكيد تسجيل الحركة'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
