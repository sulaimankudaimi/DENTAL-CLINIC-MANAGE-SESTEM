import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Calculator,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import type { PriceTierItem } from '../types';

interface PriceListsTabProps {
  tiers: PriceTierItem[];
  onSaveTiers: (tiers: PriceTierItem[]) => void;
  onNavigateToCatalog: () => void;
}

// Sample clinical procedures for interactive price comparison
const SAMPLE_PROCEDURES = [
  { code: 'D0120', name: 'كشف واستشارة طبية دورية', basePriceSAR: 150 },
  { code: 'D1110', name: 'جلسة تنظيف وتلميع وإزالة جير', basePriceSAR: 250 },
  { code: 'D2330', name: 'حشوة تجميلية كمبوزيت سن أمامي', basePriceSAR: 350 },
  { code: 'D3330', name: 'علاج عصب ضرس طاحن (3 قنوات)', basePriceSAR: 1200 },
  { code: 'D6010', name: 'زراعة سن ألماني كاملة (مع التاج)', basePriceSAR: 3500 },
  { code: 'D7210', name: 'خلع ضرس عقل مطمور جراحياً', basePriceSAR: 800 },
  { code: 'D9972', name: 'جلسة تبييض زوم بالضوء البارد Zoom', basePriceSAR: 1500 },
];

export const PriceListsTab: React.FC<PriceListsTabProps> = ({
  tiers,
  onSaveTiers,
  onNavigateToCatalog,
}) => {
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PriceTierItem | null>(null);
  const [tierName, setTierName] = useState('');
  const [tierCode, setTierCode] = useState<'cash' | 'insurance' | 'staff' | 'vip' | 'custom'>('custom');
  const [tierDescription, setTierDescription] = useState('');
  const [discountPercent, setDiscountPercent] = useState(15);
  const [isDefault, setIsDefault] = useState(false);

  const openModal = (tier?: PriceTierItem) => {
    if (tier) {
      setEditingTier(tier);
      setTierName(tier.name);
      setTierCode(tier.code);
      setTierDescription(tier.description);
      setDiscountPercent(Math.round((1 - tier.discount_multiplier) * 100));
      setIsDefault(tier.is_default);
    } else {
      setEditingTier(null);
      setTierName('');
      setTierCode('custom');
      setTierDescription('');
      setDiscountPercent(20);
      setIsDefault(false);
    }
    setIsModalOpen(true);
  };

  const handleSaveTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierName.trim()) return;

    const multiplier = parseFloat(((100 - discountPercent) / 100).toFixed(2));

    if (editingTier) {
      let updated = tiers.map((t) =>
        t.id === editingTier.id
          ? {
              ...t,
              name: tierName,
              code: tierCode,
              description: tierDescription,
              discount_multiplier: multiplier,
              is_default: isDefault,
            }
          : isDefault
          ? { ...t, is_default: false }
          : t
      );
      onSaveTiers(updated);
      showToast({ title: 'تم التحديث', description: 'تم تحديث قائمة الأسعار بنجاح', variant: 'success' });
    } else {
      const newTier: PriceTierItem = {
        id: `tier-${Date.now()}`,
        name: tierName,
        code: tierCode,
        description: tierDescription,
        discount_multiplier: multiplier,
        is_default: isDefault,
        custom_rates_count: 0,
      };
      let updated = isDefault ? tiers.map((t) => ({ ...t, is_default: false })) : [...tiers];
      updated.push(newTier);
      onSaveTiers(updated);
      showToast({ title: 'تمت الإضافة', description: 'تمت إضافة قائمة أسعار جديدة بنجاح', variant: 'success' });
    }
    setIsModalOpen(false);
  };

  const handleDeleteTier = (tierId: string) => {
    const tier = tiers.find((t) => t.id === tierId);
    if (tier?.is_default) {
      showToast({ title: 'خطأ', description: 'لا يمكن حذف قائمة الأسعار الافتراضية للعيادة', variant: 'error' });
      return;
    }
    if (!confirm('هل أنت متأكد من حذف قائمة الأسعار هذه؟')) return;
    onSaveTiers(tiers.filter((t) => t.id !== tierId));
    showToast({ title: 'تم الحذف', description: 'تم حذف قائمة الأسعار بنجاح', variant: 'success' });
  };

  const handleSetDefault = (tierId: string) => {
    const updated = tiers.map((t) => ({
      ...t,
      is_default: t.id === tierId,
    }));
    onSaveTiers(updated);
    showToast({ title: 'القائمة الافتراضية', description: 'تم تعيين القائمة المحددة كافتراضية للفواتير', variant: 'success' });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">كتالوج الإجراءات وقوائم الأسعار المتعددة</h2>
            <p className="text-xs text-text-secondary">
              إدارة قوائم أسعار النقد، التأمين، الموظفين، وباقات العروض مع احتساب تلقائي للفروقات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToCatalog}
            className="gap-1.5"
          >
            <Layers className="w-4 h-4 text-brand-navy" />
            <span>كتالوج الإجراءات الرئيسي</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => openModal()}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة قائمة أسعار</span>
          </Button>
        </div>
      </div>

      {/* Price Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((tier) => {
          const discountPct = Math.round((1 - tier.discount_multiplier) * 100);

          return (
            <div
              key={tier.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                tier.is_default
                  ? 'border-brand-navy bg-brand-navy/5 shadow-xs ring-1 ring-brand-navy/30'
                  : 'border-surface-border bg-surface-card hover:border-slate-300'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <span className="font-bold text-xs text-text-primary">{tier.name}</span>
                  {tier.is_default ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> الافتراضية
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(tier.id)}
                      className="text-[10px] text-text-secondary hover:text-brand-navy hover:underline"
                    >
                      تعيين كافتراضية
                    </button>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-brand-navy">
                    {discountPct === 0 ? '100%' : `${100 - discountPct}%`}
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    {discountPct === 0 ? 'السعر الكامل' : `(خصم ${discountPct}%)`}
                  </span>
                </div>

                <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                  {tier.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-border/50 flex items-center justify-between">
                <span className="text-[10px] text-text-secondary">
                  {tier.custom_rates_count} أسعار محددة
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openModal(tier)}
                    className="p-1.5 text-text-secondary hover:text-brand-navy rounded hover:bg-white"
                    title="تعديل القائمة"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {!tier.is_default && (
                    <button
                      onClick={() => handleDeleteTier(tier.id)}
                      className="p-1.5 text-text-secondary hover:text-red-600 rounded hover:bg-white"
                      title="حذف القائمة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Price Comparison Table */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border/60">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">محاكاة مقارنة الأسعار المباشرة حسب القوائم</h3>
              <p className="text-xs text-text-secondary">
                عرض حي لأسعار أبرز الإجراءات الطبية المحتسبة تلقائياً حسب كل قائمة
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-border text-text-secondary text-right">
                <th className="py-2.5 px-3 font-bold">كود ADA</th>
                <th className="py-2.5 px-3 font-bold">الإجراء الطبي</th>
                <th className="py-2.5 px-3 font-bold">السعر الأساسي (نقدي)</th>
                {tiers
                  .filter((t) => t.code !== 'cash')
                  .map((t) => (
                    <th key={t.id} className="py-2.5 px-3 font-bold">
                      {t.name}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {SAMPLE_PROCEDURES.map((proc) => (
                <tr key={proc.code} className="hover:bg-surface-ground">
                  <td className="py-3 px-3 font-mono text-brand-navy font-bold">{proc.code}</td>
                  <td className="py-3 px-3 font-bold text-text-primary">{proc.name}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {proc.basePriceSAR.toLocaleString('en-US')} ر.س
                  </td>
                  {tiers
                    .filter((t) => t.code !== 'cash')
                    .map((t) => {
                      const calculated = Math.round(proc.basePriceSAR * t.discount_multiplier);
                      return (
                        <td key={t.id} className="py-3 px-3 font-mono font-semibold text-emerald-700">
                          {calculated.toLocaleString('en-US')} ر.س
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTier ? 'تعديل قائمة الأسعار' : 'إضافة قائمة أسعار جديدة'}
      >
        <form onSubmit={handleSaveTier} className="space-y-4">
          <Input
            label="اسم قائمة الأسعار *"
            value={tierName}
            onChange={(e) => setTierName(e.target.value)}
            placeholder="مثال: قائمة تأمين بوبا والتكافل"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">نوع التصنيف</label>
              <select
                value={tierCode}
                onChange={(e) => setTierCode(e.target.value as any)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-surface-border bg-surface-card"
              >
                <option value="cash">نقدي قياسي (Standard Cash)</option>
                <option value="insurance">شبكات تأمين (Insurance Tier)</option>
                <option value="staff">موظفون وأقارب (Staff & Family)</option>
                <option value="vip">باقات VIP ومواسم (VIP Packages)</option>
                <option value="custom">مخصص (Custom Tier)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">نسبة الخصم من السعر الأساسي (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(0, Math.min(90, parseInt(e.target.value) || 0)))}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-surface-border bg-surface-card"
                />
                <span className="absolute left-3 top-2.5 text-xs text-text-secondary font-bold">%</span>
              </div>
            </div>
          </div>

          <Input
            label="الوصف أو شروط التطبيق"
            value={tierDescription}
            onChange={(e) => setTierDescription(e.target.value)}
            placeholder="مثال: تطبق على حاملي بطاقات الفئة الذهبية"
          />

          <div className="flex items-center gap-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded text-brand-navy"
              />
              <span className="font-bold text-text-primary">تعيين كقائمة الأسعار الافتراضية للفواتير الجديدة</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-surface-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary">
              {editingTier ? 'حفظ التعديل' : 'إضافة القائمة'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
