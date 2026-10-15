import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { INVENTORY_CATEGORIES, INVENTORY_UNITS } from './constants';
import type { InventoryItem, CreateInventoryItem, Supplier } from '@shared/contracts';
import { Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';

interface InventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInventoryItem) => Promise<void>;
  item?: InventoryItem | null;
  suppliers: Supplier[];
  isLoading?: boolean;
}

export const InventoryItemModal: React.FC<InventoryItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
  suppliers,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<string>(INVENTORY_CATEGORIES[0]);
  const [unit, setUnit] = useState<string>(INVENTORY_UNITS[0]);
  const [customUnit, setCustomUnit] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [minQuantity, setMinQuantity] = useState(5);
  const [costRiyal, setCostRiyal] = useState('50');
  const [supplierId, setSupplierId] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [location, setLocation] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setSku(item.sku);
      setCategory(item.category);
      if (INVENTORY_UNITS.includes(item.unit as any)) {
        setUnit(item.unit);
        setCustomUnit('');
      } else {
        setUnit('custom');
        setCustomUnit(item.unit);
      }
      setQuantity(item.quantity);
      setMinQuantity(item.min_quantity);
      setCostRiyal((item.cost_halalas / 100).toString());
      setSupplierId(item.supplier_id || '');
      setExpiryDate(item.expiry_date || '');
      setLocation(item.location || '');
    } else {
      setName('');
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategory(INVENTORY_CATEGORIES[0]);
      setUnit(INVENTORY_UNITS[0]);
      setCustomUnit('');
      setQuantity(10);
      setMinQuantity(5);
      setCostRiyal('50');
      setSupplierId('');
      setExpiryDate('');
      setLocation('');
    }
    setErrorMsg(null);
  }, [item, isOpen]);

  // Expiry preview calculations
  let expiryDays: number | null = null;
  let isExpiringSoon = false;
  let isExpired = false;
  if (expiryDate) {
    const diff = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
    expiryDays = diff;
    if (diff <= 0) {
      isExpired = true;
    } else if (diff <= 60) {
      isExpiringSoon = true;
    }
  }

  const handleQuickExpiry = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    setExpiryDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم الصنف أو المادة الطبية');
      return;
    }
    if (!sku.trim()) {
      setErrorMsg('يرجى تحديد رمز SKU للصنف');
      return;
    }

    const finalUnit = unit === 'custom' ? customUnit.trim() || 'قطعة' : unit;
    const costHalalas = Math.round((parseFloat(costRiyal) || 0) * 100);

    try {
      await onSubmit({
        clinic_id: item?.clinic_id || 'c1000000-0000-0000-0000-000000000001',
        name: name.trim(),
        sku: sku.trim(),
        category,
        unit: finalUnit,
        quantity: Math.max(0, quantity),
        min_quantity: Math.max(0, minQuantity),
        cost_halalas: Math.max(0, costHalalas),
        supplier_id: supplierId || null,
        expiry_date: expiryDate || null,
        location: location.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ الصنف');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'تعديل بيانات الصنف المخزني' : 'إضافة صنف أو مادة طبية جديدة'}
      description="تسجيل مواصفات الصنف، وحدة القياس، حد التنبيه، وتاريخ الصلاحية لربطها بالتنبيهات الآلية"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="اسم الصنف أو المادة الطبية *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: كومبوزيت 3M Filtek Z350 XT A2"
            required
          />

          <Input
            label="رمز التتبع المخزني (SKU) *"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="COMP-3M-A2"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="التصنيف الطبي *"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={INVENTORY_CATEGORIES.map((c) => ({ label: c, value: c }))}
          />

          <div className="space-y-1.5">
            <Select
              label="وحدة القياس / التعبئة *"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              options={[
                ...INVENTORY_UNITS.map((u) => ({ label: u, value: u })),
                { label: 'وحدة مخصصة أخرى...', value: 'custom' },
              ]}
            />
            {unit === 'custom' && (
              <Input
                placeholder="أدخل الوحدة المخصصة..."
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                required
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              الكمية المتوفرة حالياً *
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 font-mono text-center font-bold focus:outline-hidden focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              الوحدة: {unit === 'custom' ? customUnit || 'قطعة' : unit}
            </span>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              حد الطلب الأدنى للتنبيه *
            </label>
            <input
              type="number"
              min="0"
              value={minQuantity}
              onChange={(e) => setMinQuantity(parseInt(e.target.value, 10) || 0)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 font-mono text-center font-bold focus:outline-hidden focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
            />
            <span className="text-[10px] text-amber-600 mt-1 block">
              يُطلق تنبيهاً باللوحة عند الوصول إليه
            </span>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              تكلفة الوحدة (ر.س) *
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={costRiyal}
              onChange={(e) => setCostRiyal(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 font-mono text-center font-bold focus:outline-hidden focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">سعر الشراء من المورد</span>
          </div>
        </div>

        {/* Expiry Date Section */}
        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 font-bold text-amber-950">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>تاريخ انتهاء الصلاحية (مع تنبيه مسبق قبل 60 يوماً)</span>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleQuickExpiry(6)}
                className="px-2 py-0.5 text-[10px] bg-white border border-amber-300 rounded hover:bg-amber-100 text-amber-900 font-medium transition-colors"
              >
                +6 أشهر
              </button>
              <button
                type="button"
                onClick={() => handleQuickExpiry(12)}
                className="px-2 py-0.5 text-[10px] bg-white border border-amber-300 rounded hover:bg-amber-100 text-amber-900 font-medium transition-colors"
              >
                +سنة
              </button>
              <button
                type="button"
                onClick={() => handleQuickExpiry(24)}
                className="px-2 py-0.5 text-[10px] bg-white border border-amber-300 rounded hover:bg-amber-100 text-amber-900 font-medium transition-colors"
              >
                +سنتين
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            />

            {expiryDays !== null ? (
              <div className="text-xs">
                {isExpired ? (
                  <span className="text-rose-700 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    منتهي الصلاحية منذ {Math.abs(expiryDays)} يوم!
                  </span>
                ) : isExpiringSoon ? (
                  <span className="text-amber-800 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    تنبيه: يقارب على الانتهاء خلال {expiryDays} يوماً (أقل من 60 يوم)
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    الصلاحية ممتازة (متبقي {expiryDays} يوم)
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400 text-[11px]">
                اختياري — للمواد الحساسة كالبنج والمحاليل المعقمة
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="المورد الرئيسي المعتمد"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            options={[
              { label: 'بدون مورد محدد حالياً', value: '' },
              ...suppliers.map((s) => ({ label: s.name, value: s.id })),
            ]}
          />

          <Input
            label="موقع التخزين / الرف في العيادة"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="مثال: غرفة الأدوية - الثلاجة الطبية"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'جاري الحفظ...' : item ? 'حفظ التعديلات' : 'إضافة الصنف للمستودع'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
