import React, { useState, useEffect } from 'react';
import type { Procedure, ProcedureCategory } from '@shared/contracts';
import { PROCEDURE_CATEGORIES, PROCEDURE_CATEGORY_AR } from '@shared/contracts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Save, Stethoscope } from 'lucide-react';

export interface ProcedureFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Procedure>) => Promise<void>;
  procedure?: Procedure | null;
  clinicId?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  diagnostic: '#1E4E9C',
  preventive: '#10B981',
  restorative: '#3B82F6',
  endodontics: '#8B5CF6',
  oral_surgery: '#EF4444',
  prosthodontics: '#F59E0B',
  orthodontics: '#EC4899',
  whitening: '#06B6D4',
  implantology: '#0D9488',
  pediatric: '#F97316',
  periodontics: '#14B8A6',
};

export const ProcedureFormDialog: React.FC<ProcedureFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  procedure,
  clinicId = 'c1000000-0000-0000-0000-000000000001',
}) => {
  const [category, setCategory] = useState<ProcedureCategory>('restorative');
  const [code, setCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [priceSar, setPriceSar] = useState<number | ''>(250);
  const [durationMin, setDurationMin] = useState<number | ''>(30);
  const [requiresTooth, setRequiresTooth] = useState(true);
  const [requiresSurface, setRequiresSurface] = useState(false);
  const [color, setColor] = useState('#3B82F6');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (procedure) {
      setCategory(procedure.category as ProcedureCategory);
      setCode(procedure.code);
      setNameAr(procedure.name_ar);
      setNameEn(procedure.name_en || '');
      setPriceSar(Math.round(procedure.default_price_halalas / 100));
      setDurationMin(procedure.default_duration_min);
      setRequiresTooth(procedure.requires_tooth);
      setRequiresSurface(procedure.requires_surface);
      setColor(procedure.color || CATEGORY_COLORS[procedure.category] || '#1E4E9C');
      setIsActive(procedure.is_active);
    } else {
      setCategory('restorative');
      setCode('');
      setNameAr('');
      setNameEn('');
      setPriceSar(250);
      setDurationMin(30);
      setRequiresTooth(true);
      setRequiresSurface(false);
      setColor('#3B82F6');
      setIsActive(true);
    }
    setErrorMessage('');
  }, [procedure, isOpen]);

  const handleCategoryChange = (newCat: ProcedureCategory) => {
    setCategory(newCat);
    if (!procedure) {
      setColor(CATEGORY_COLORS[newCat] || '#1E4E9C');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMessage('يرجى إدخال كود الإجراء');
      return;
    }
    if (!nameAr.trim()) {
      setErrorMessage('يرجى إدخال اسم الإجراء باللغة العربية');
      return;
    }
    if (priceSar === '' || priceSar < 0) {
      setErrorMessage('يرجى تحديد سعر صالح بالريال السعودي');
      return;
    }
    if (durationMin === '' || durationMin < 5) {
      setErrorMessage('يرجى تحديد المدة التقديرية بالدقائق (5 دقائق على الأقل)');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        clinic_id: clinicId,
        category,
        code: code.trim().toUpperCase(),
        name_ar: nameAr.trim(),
        name_en: nameEn.trim() || nameAr.trim(),
        default_price_halalas: Math.round(Number(priceSar) * 100),
        default_duration_min: Number(durationMin),
        requires_tooth: requiresTooth,
        requires_surface: requiresSurface,
        color,
        is_active: isActive,
      });
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الإجراء');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-navy flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5 text-[#1E4E9C]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {procedure ? 'تعديل بيانات الإجراء السريري' : 'إضافة إجراء سريري جديد إلى الكتالوج'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تحديد كود الإجراء، التصنيف، السعر المعياري، ومتطلبات السن والسطح
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-right">
          {errorMessage && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الفئة التخصصية <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as ProcedureCategory)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4E9C]/20"
              >
                {PROCEDURE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {PROCEDURE_CATEGORY_AR[cat] || cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                رمز الإجراء الكودي (Code) <span className="text-rose-500">*</span>
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: D2391 أو PRO-101"
                className="text-xs font-mono uppercase"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              اسم الإجراء بالعربية <span className="text-rose-500">*</span>
            </label>
            <Input
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="مثال: حشوة كمبوزيت تجميلية خلفية (سطح واحد)"
              className="text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              الاسم بالإنجليزية (اختياري)
            </label>
            <Input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Posterior Composite Resin (1 Surface)"
              className="text-xs font-sans"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                السعر المعياري الافتراضي (ر.س) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={priceSar}
                  onChange={(e) => setPriceSar(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="250"
                  className="text-xs font-bold pl-12"
                  required
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium select-none">
                  ر.س
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                المدة المعيارية المقدرة <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min={5}
                  max={360}
                  step={5}
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="30"
                  className="text-xs font-bold pl-14"
                  required
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium select-none">
                  دقيقة
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Checkboxes */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <span className="text-xs font-bold text-slate-800 block mb-1">المتطلبات السريرية:</span>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={requiresTooth}
                  onChange={(e) => setRequiresTooth(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-navy focus:ring-brand-blue"
                />
                <span className="text-slate-700 font-medium">يتطلب تحديد رقم السن (11-85)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={requiresSurface}
                  onChange={(e) => setRequiresSurface(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-navy focus:ring-brand-blue"
                />
                <span className="text-slate-700 font-medium">يتطلب تحديد أسطح السن (M, O, D...)</span>
              </label>
            </div>
          </div>

          {/* Color & Status */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700">لون العلامة:</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
              />
              <span className="text-[11px] font-mono text-slate-500">{color}</span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-800">
                تفعيل الإجراء في قوائم العيادة (نشط)
              </span>
            </label>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Save className="w-4 h-4" />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'جاري الحفظ...' : procedure ? 'حفظ التعديلات' : 'إضافة الإجراء'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcedureFormDialog;
