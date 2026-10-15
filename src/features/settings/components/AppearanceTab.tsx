import React, { useState } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Type,
  Hash,
  Calendar,
  CheckCircle2,
  Save,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { AppearanceSettings } from '../types';

interface AppearanceTabProps {
  settings: AppearanceSettings;
  onSave: (updated: AppearanceSettings) => void;
  isSaving: boolean;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({
  settings,
  onSave,
  isSaving,
}) => {
  const { showToast } = useToast();
  const [form, setForm] = useState<AppearanceSettings>(settings);

  // Apply visual changes immediately to document
  const applyVisualSettings = (newSettings: AppearanceSettings) => {
    // 1. Dark/Light theme class on document element
    if (newSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Font Size
    if (newSettings.font_size === 'large') {
      document.documentElement.style.fontSize = '17px';
    } else if (newSettings.font_size === 'medium') {
      document.documentElement.style.fontSize = '15.5px';
    } else {
      document.documentElement.style.fontSize = '14px';
    }

    // 3. Numeral & Calendar System
    if (newSettings.numeral_system) {
      document.documentElement.setAttribute('data-numeral-system', newSettings.numeral_system);
    }
    if (newSettings.calendar_system) {
      document.documentElement.setAttribute('data-calendar-system', newSettings.calendar_system);
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark') => {
    const updated = { ...form, theme };
    setForm(updated);
    applyVisualSettings(updated);
  };

  const handleFontSizeChange = (font_size: 'normal' | 'medium' | 'large') => {
    const updated = { ...form, font_size };
    setForm(updated);
    applyVisualSettings(updated);
  };

  const handleNumeralChange = (numeral_system: 'latin' | 'arabic') => {
    const updated = { ...form, numeral_system };
    setForm(updated);
    applyVisualSettings(updated);
  };

  const handleCalendarChange = (calendar_system: 'gregorian' | 'hijri' | 'both') => {
    const updated = { ...form, calendar_system };
    setForm(updated);
    applyVisualSettings(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    applyVisualSettings(form);
    onSave(form);
    showToast({
      title: 'تم تطبيق المظهر',
      description: 'تم تحديث تفضيلات المظهر والخط والأرقام والتقويم فورياً',
      variant: 'success',
    });
  };

  // Convert numbers to Arabic eastern digits if selected
  const formatSampleNumber = (numStr: string) => {
    if (form.numeral_system === 'arabic') {
      const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return numStr.replace(/\d/g, (d) => arabicDigits[parseInt(d)]);
    }
    return numStr;
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">تخصيص المظهر، الخط، الأرقام والتقويم</h2>
            <p className="text-xs text-text-secondary">
              تؤثر هذه الإعدادات مباشرة في تجربة استخدام النظام دون الحاجة لإعادة التشغيل
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
          <span>تطبيق وحفظ الإعدادات</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Theme (Light / Dark) */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-surface-border/60">
            <Sun className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-text-primary">نمط العرض والثيم (Theme)</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2.5 ${
                form.theme === 'light'
                  ? 'border-brand-navy bg-brand-navy/5 ring-2 ring-brand-navy/20'
                  : 'border-surface-border bg-surface-ground hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-text-primary block">النمط الفاتح (Light)</span>
                <span className="text-[10px] text-text-secondary">مناسب للعيادات ذات الإضاءة العالية</span>
              </div>
              {form.theme === 'light' && (
                <CheckCircle2 className="w-4 h-4 text-brand-navy" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2.5 ${
                form.theme === 'dark'
                  ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-600/20'
                  : 'border-surface-border bg-surface-ground hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 text-purple-300 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-text-primary block">النمط الداكن (Dark)</span>
                <span className="text-[10px] text-text-secondary">مريح للعين أثناء قراءة الأشعة</span>
              </div>
              {form.theme === 'dark' && (
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
              )}
            </button>
          </div>
        </div>

        {/* 2. Font Size */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-surface-border/60">
            <Type className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-text-primary">حجم خط الواجهة (Font Scale)</h3>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'normal', label: 'عادي (14px)', desc: 'الافتراضي المتوازن' },
              { id: 'medium', label: 'متوسط (16px)', desc: 'قراءة مريحة' },
              { id: 'large', label: 'كبير (18px)', desc: 'شاشات العيادات الكبيرة' },
            ].map((fs) => {
              const isSelected = form.font_size === fs.id;
              return (
                <button
                  key={fs.id}
                  type="button"
                  onClick={() => handleFontSizeChange(fs.id as any)}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col justify-between items-center ${
                    isSelected
                      ? 'border-brand-navy bg-brand-navy/5 ring-2 ring-brand-navy/20'
                      : 'border-surface-border bg-surface-ground hover:border-slate-300'
                  }`}
                >
                  <span className={`text-xs font-bold ${isSelected ? 'text-brand-navy' : 'text-text-primary'}`}>
                    {fs.label}
                  </span>
                  <span className="text-[10px] text-text-secondary mt-1">{fs.desc}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-brand-navy mt-1.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Numeral System */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-surface-border/60">
            <Hash className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold text-text-primary">تنسيق الأرقام (Numeral System)</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleNumeralChange('latin')}
              className={`p-3.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                form.numeral_system === 'latin'
                  ? 'border-brand-navy bg-brand-navy/5 ring-1 ring-brand-navy/30'
                  : 'border-surface-border bg-surface-ground hover:border-slate-300'
              }`}
            >
              <div>
                <span className="text-xs font-bold text-text-primary block">أرقام لاتينية دولية</span>
                <span className="text-xs font-mono text-brand-navy font-bold">1 2 3 4 5 6 7 8 9 0</span>
              </div>
              {form.numeral_system === 'latin' && <CheckCircle2 className="w-4 h-4 text-brand-navy" />}
            </button>

            <button
              type="button"
              onClick={() => handleNumeralChange('arabic')}
              className={`p-3.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                form.numeral_system === 'arabic'
                  ? 'border-brand-navy bg-brand-navy/5 ring-1 ring-brand-navy/30'
                  : 'border-surface-border bg-surface-ground hover:border-slate-300'
              }`}
            >
              <div>
                <span className="text-xs font-bold text-text-primary block">أرقام عربية مشرقية</span>
                <span className="text-xs font-mono text-brand-navy font-bold">١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩ ٠</span>
              </div>
              {form.numeral_system === 'arabic' && <CheckCircle2 className="w-4 h-4 text-brand-navy" />}
            </button>
          </div>
        </div>

        {/* 4. Calendar System */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-surface-border/60">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-text-primary">نظام التقويم (Calendar Format)</h3>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'both', label: 'كلاهما معاً (موصى به)', desc: 'ميلادي وهجري معاً' },
              { id: 'gregorian', label: 'ميلادي فقط', desc: 'Gregorian' },
              { id: 'hijri', label: 'هجري فقط', desc: 'أم القرى' },
            ].map((cal) => {
              const isSelected = form.calendar_system === cal.id;
              return (
                <button
                  key={cal.id}
                  type="button"
                  onClick={() => handleCalendarChange(cal.id as any)}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col justify-between items-center ${
                    isSelected
                      ? 'border-brand-navy bg-brand-navy/5 ring-2 ring-brand-navy/20'
                      : 'border-surface-border bg-surface-ground hover:border-slate-300'
                  }`}
                >
                  <span className={`text-xs font-bold ${isSelected ? 'text-brand-navy' : 'text-text-primary'}`}>
                    {cal.label}
                  </span>
                  <span className="text-[10px] text-text-secondary mt-1">{cal.desc}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-brand-navy mt-1.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold text-text-primary">معاينة مباشرة للتنسيق الحالي على الواجهة</h3>
        </div>

        <div className="p-4 rounded-xl bg-surface-ground border border-surface-border flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] text-text-secondary block">تاريخ اليوم والتقويم المحدد:</span>
            <div className="font-bold text-xs text-text-primary flex items-center gap-2">
              {(form.calendar_system === 'gregorian' || form.calendar_system === 'both') && (
                <span>السبت {formatSampleNumber('29')} سبتمبر {formatSampleNumber('2026')} م</span>
              )}
              {form.calendar_system === 'both' && <span className="text-text-secondary">/</span>}
              {(form.calendar_system === 'hijri' || form.calendar_system === 'both') && (
                <span className="text-emerald-700">
                  {formatSampleNumber('18')} ربيع الأول {formatSampleNumber('1448')} هـ
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-text-secondary block">عرض المبالغ والأرقام:</span>
            <span className="font-bold text-xs font-mono text-brand-navy">
              {formatSampleNumber('1,450.00')} ريال سعودي
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-text-secondary block">توقيت المواعيد:</span>
            <span className="font-bold text-xs text-slate-800">
              {formatSampleNumber('04:30')} مساءً
            </span>
          </div>
        </div>
      </div>
    </form>
  );
};
