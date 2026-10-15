import React, { useState } from 'react';
import { Building2, Save, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import type { ClinicProfileSettings } from '../types';

interface ClinicTabProps {
  settings: ClinicProfileSettings;
  onSave: (updated: ClinicProfileSettings) => void;
  isSaving: boolean;
}

const PRESET_LOGOS = [
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=160&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=160&auto=format&fit=crop&q=80',
];

export const ClinicTab: React.FC<ClinicTabProps> = ({ settings, onSave, isSaving }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState<ClinicProfileSettings>(settings);
  const [logoInput, setLogoInput] = useState('');
  const [showLogoInput, setShowLogoInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast({ title: 'تنبيه', description: 'يرجى إدخال اسم العيادة', variant: 'error' });
      return;
    }
    if (form.tax_number && form.tax_number.length !== 15) {
      showToast({
        title: 'تنبيه ضريبي',
        description: 'الرقم الضريبي ZATCA يجب أن يتكون من 15 رقماً ويبدأ وينتهي بـ 3',
        variant: 'warning',
      });
    }
    onSave(form);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setForm((prev) => ({ ...prev, logo_url: result }));
      showToast({ title: 'تم الرفع', description: 'تم تحديث شعار العيادة بنجاح', variant: 'success' });
    };
    reader.readAsDataURL(file);
  };

  const isTaxNumberValid = form.tax_number ? form.tax_number.length === 15 && form.tax_number.startsWith('3') && form.tax_number.endsWith('3') : true;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      {/* Header & Save Action */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-navy/10 flex items-center justify-center text-brand-navy shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">بيانات المنشأة والهوية الضريبية</h2>
            <p className="text-xs text-text-secondary">
              تظهر هذه البيانات على الفواتير الضريبية ZATCA، الترويسات الرسمية، وتقارير المرضى
            </p>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={isSaving}
          className="gap-2 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>حفظ التعديلات</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Logo & Branding */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-5">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">شعار وهوية العيادة</h3>

          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-surface-border rounded-xl bg-surface-ground text-center space-y-3">
            {form.logo_url ? (
              <div className="relative group">
                <img
                  src={form.logo_url}
                  alt="شعار العيادة"
                  className="w-28 h-28 object-contain rounded-lg border border-surface-border bg-white p-2 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, logo_url: null }))}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 text-[10px] hover:bg-red-700 shadow-sm"
                  title="إزالة الشعار"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-brand-navy/5 border border-surface-border flex flex-col items-center justify-center text-brand-navy gap-1">
                <Building2 className="w-8 h-8 text-brand-navy/60" />
                <span className="text-[10px] font-bold text-text-secondary">لا يوجد شعار</span>
              </div>
            )}

            <div className="flex flex-col gap-2 w-full">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <span className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-bold rounded-lg border border-surface-border bg-surface-card hover:bg-surface-ground text-text-primary transition-colors">
                  <Upload className="w-3.5 h-3.5 text-brand-navy" />
                  رفع شعار من الجهاز
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowLogoInput(!showLogoInput)}
                className="text-[11px] text-brand-navy hover:underline font-medium"
              >
                {showLogoInput ? 'إخفاء رابط الصورة' : 'أو إدخال رابط صورة مباشرة'}
              </button>
            </div>

            {showLogoInput && (
              <div className="flex gap-1.5 w-full mt-2">
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoInput}
                  onChange={(e) => setLogoInput(e.target.value)}
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-surface-border bg-surface-card"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (logoInput.trim()) {
                      setForm((p) => ({ ...p, logo_url: logoInput.trim() }));
                      setLogoInput('');
                      setShowLogoInput(false);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-brand-navy text-white text-xs rounded-lg font-bold"
                >
                  تطبيق
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-text-secondary">نماذج شعارات طبية سريعة:</span>
            <div className="flex gap-2">
              {PRESET_LOGOS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, logo_url: url }))}
                  className="p-1 rounded-lg border border-surface-border hover:border-brand-navy bg-white"
                >
                  <img src={url} alt="نموذج" className="w-12 h-12 object-cover rounded" />
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] space-y-1">
            <span className="font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              ملاحظة الطباعة:
            </span>
            <p>يظهر الشعار تلقائياً في رأس فواتير المبيعات، خطط العلاج المطبوعة، وتقارير المرضى.</p>
          </div>
        </div>

        {/* Right Columns: Main Fields */}
        <div className="lg:col-span-2 bg-surface-card rounded-2xl border border-surface-border p-6 space-y-5">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">المعلومات القانونية والمالية</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="اسم العيادة / المركز الطبي *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Input
                label="رقم الهاتف / الاتصال الموحد *"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>

            <div>
              <Input
                label="البريد الإلكتروني للعيادة"
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                الرقم الضريبي ZATCA (15 رقماً)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={15}
                  value={form.tax_number || ''}
                  onChange={(e) => setForm({ ...form, tax_number: e.target.value.replace(/\D/g, '') })}
                  placeholder="310123456700003"
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-surface-card focus:outline-none focus:ring-2 ${
                    isTaxNumberValid
                      ? 'border-surface-border focus:ring-brand-navy/20'
                      : 'border-red-400 focus:ring-red-200'
                  }`}
                />
                {form.tax_number && form.tax_number.length === 15 && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                )}
              </div>
              <span className="text-[10px] text-text-secondary mt-0.5 block">
                {form.tax_number ? `${form.tax_number.length} / 15 خانة` : 'اختياري في حال عدم التسجيل بالضريبة'}
              </span>
            </div>

            <div>
              <Input
                label="رقم السجل التجاري (CR)"
                value={form.cr_number || ''}
                onChange={(e) => setForm({ ...form, cr_number: e.target.value })}
                placeholder="1010XXXXXX"
              />
            </div>

            <div>
              <Input
                label="المدينة"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">العملة الأساسية</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-surface-border bg-surface-card focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
                >
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="AED">درهم إماراتي (AED)</option>
                  <option value="KWD">دينار كويتي (KWD)</option>
                  <option value="BHD">دينار بحريني (BHD)</option>
                  <option value="OMR">ريال عماني (OMR)</option>
                  <option value="QAR">ريال قطري (QAR)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="EUR">يورو (EUR)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">نسبة الضريبة (VAT %)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={form.tax_rate_percent}
                    onChange={(e) => setForm({ ...form, tax_rate_percent: parseFloat(e.target.value) || 0 })}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-surface-border bg-surface-card focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-text-secondary font-bold">%</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <Input
                label="العنوان التفصيلي والشارع"
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="الشارع، الحي، رقم المبنى"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
