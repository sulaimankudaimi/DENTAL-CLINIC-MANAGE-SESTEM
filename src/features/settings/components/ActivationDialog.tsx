import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Wifi,
  WifiOff,
  Copy,
  Check,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { useLicenseStore } from '@/store/useLicenseStore';

interface ActivationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActivationDialog: React.FC<ActivationDialogProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const { isOnlineAvailable, deviceCode, refreshLicenseStatus } = useLicenseStore();

  const [activeTab, setActiveTab] = useState<'online' | 'offline'>('online');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [localDeviceCode, setLocalDeviceCode] = useState(deviceCode || '');
  const [hasCopied, setHasCopied] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // تحديث كود الجهاز عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      api.license.getDeviceCode().then((res) => {
        if (res.ok && res.data) {
          setLocalDeviceCode(res.data);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  // قناع إدخال كود الترخيص: EYD-XXXXX-XXXXX-XXXXX
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // إذا بدأ المستخدم بكتابة EYD لا نكررها
    if (val.startsWith('EYD')) {
      val = val.slice(3);
    }

    // تقطيع إلى 3 مجموعات كل منها 5 أحرف
    const part1 = val.slice(0, 5);
    const part2 = val.slice(5, 10);
    const part3 = val.slice(10, 15);

    let formatted = 'EYD';
    if (part1) formatted += '-' + part1;
    if (part2) formatted += '-' + part2;
    if (part3) formatted += '-' + part3;

    setCode(formatted);
  };

  const isCodeValid = /^EYD-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/i.test(code.trim());

  const handleCopyDeviceCode = async () => {
    try {
      await navigator.clipboard.writeText(localDeviceCode);
      setHasCopied(true);
      showToast({
        title: 'تم النسخ',
        description: 'تم نسخ كود الجهاز إلى الحافظة بنجاح.',
        variant: 'success',
      });
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      showToast({
        title: 'فشل النسخ',
        description: 'تعذر النسخ التلقائي، يُرجى نسخ الكود يدوياً.',
        variant: 'error',
      });
    }
  };

  const handleOnlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCodeValid) {
      setErrorMsg('صيغة كود الترخيص غير مكتملة. الصيغة الصحيحة: EYD-XXXXX-XXXXX-XXXXX');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.license.activateOnline(code.trim());
      if (res.ok) {
        showToast({
          title: 'تم التفعيل بنجاح',
          description: 'تم تفعيل ترخيص نظام عيادتي بنجاح عبر الإنترنت وتحديث بيانات المنشأة.',
          variant: 'success',
        });
        await refreshLicenseStatus();
        onClose();
      } else {
        setErrorMsg(res.error || 'فشل التفعيل عبر خادم التراخيص.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ غير متوقع أثناء الاتصال بخادم التراخيص.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfflineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = token.trim();
    if (!cleanToken) {
      setErrorMsg('يرجى لصق رمز الترخيص كاملاً.');
      return;
    }

    if (!cleanToken.startsWith('EYD1.')) {
      setErrorMsg('رمز الترخيص غير صحيح. يجب أن يبدأ الرمز بـ EYD1.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.license.activate(cleanToken);
      if (res.ok) {
        showToast({
          title: 'تم التفعيل بنجاح',
          description: 'تم التحقق من الرمز الرقمي وتفعيل النظام بنجاح دون اتصال.',
          variant: 'success',
        });
        await refreshLicenseStatus();
        onClose();
      } else {
        setErrorMsg(res.error || 'رمز الترخيص غير صالح أو غير مخصص لهذا الجهاز.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'فشل التحقق من رمز الترخيص.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تفعيل وتحديث ترخيص نظام عيادتي"
      description="اختر طريقة التفعيل المناسبة لمنشأتك (عبر كود التفعيل أونلاين أو عبر رمز التفعيل دون اتصال)"
      size="lg"
    >
      <div className="space-y-5 py-1">
        {/* شريط التبويبات */}
        <div className="flex border-b border-surface-border">
          <button
            type="button"
            onClick={() => {
              setActiveTab('online');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'online'
                ? 'border-brand-navy text-brand-navy'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>بالكود (أونلاين)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('offline');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'offline'
                ? 'border-brand-navy text-brand-navy'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <WifiOff className="w-4 h-4" />
            <span>بالرمز (دون اتصال)</span>
          </button>
        </div>

        {/* عرض رسالة الخطأ إن وجدت */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMsg}</span>
          </div>
        )}

        {/* تبويب: بالكود (أونلاين) */}
        {activeTab === 'online' && (
          <form onSubmit={handleOnlineSubmit} className="space-y-4">
            {!isOnlineAvailable ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>التفعيل عبر الإنترنت غير مهيأ حالياً</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  ميزة التفعيل بالكود عبر الإنترنت غير مفعّلة لعدم ضبط عنوان خادم التراخيص (LICENSE_SERVER_URL).
                  يمكنك استخدام التفعيل اليدوي بالرمز دون اتصال من التبويب الآخر.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/70 text-blue-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-brand-navy">
                  <Sparkles className="w-4 h-4 text-brand-navy" />
                  <span>تفعيل فوري وآمن بنقرة واحدة</span>
                </div>
                <p className="text-[11px] text-blue-800/80 leading-relaxed">
                  أدخل كود الترخيص المكون من 16 حرفاً الصادر مع فاتورة الاشتراك. سيتم ربط الترخيص بهذا الجهاز وتجديد الصلاحية تلقائياً.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="license-code-input" className="block text-xs font-bold text-text-primary">
                كود الترخيص (License Code):
              </label>
              <div className="relative">
                <input
                  id="license-code-input"
                  type="text"
                  dir="ltr"
                  placeholder="EYD-XXXXX-XXXXX-XXXXX"
                  value={code}
                  onChange={handleCodeChange}
                  disabled={isLoading || !isOnlineAvailable}
                  className="w-full text-center tracking-widest font-mono text-sm py-2.5 px-3 rounded-xl border border-surface-border bg-surface-card text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-navy disabled:opacity-50 disabled:bg-slate-100"
                  maxLength={21}
                />
                <KeyRound className="absolute start-3 top-3 w-4 h-4 text-text-secondary pointer-events-none" />
              </div>
              <span className="text-[11px] text-text-secondary block">
                الصيغة المطلوبة: EYD متبوعة بثلاث مجموعات خماسية مفصولة بشرطات.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !isOnlineAvailable || !isCodeValid}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التفعيل عبر الخادم...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>تفعيل الترخيص الآن</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* تبويب: بالرمز (دون اتصال) */}
        {activeTab === 'offline' && (
          <form onSubmit={handleOfflineSubmit} className="space-y-4">
            {/* عرض كود الجهاز للنسخ */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">كود هذا الجهاز (Device Code):</span>
                <button
                  type="button"
                  onClick={handleCopyDeviceCode}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-navy hover:text-blue-800 bg-white border border-slate-200 px-2 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ كود الجهاز</span>
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-xs font-bold text-text-primary tracking-widest bg-white p-2 rounded-lg border border-slate-200/80 text-center" dir="ltr">
                {localDeviceCode || 'جاري استخراج كود الجهاز...'}
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                يرجى تزويد فريق الدعم الفني بهذا الكود لإنشاء رمز الترخيص المشفر (EYD1) المخصص حصرياً لهذا الجهاز.
              </p>
            </div>

            {/* حقل لصق الرمز */}
            <div className="space-y-1.5">
              <label htmlFor="license-token-input" className="block text-xs font-bold text-text-primary">
                رمز الترخيص المشفر (License Token):
              </label>
              <textarea
                id="license-token-input"
                dir="ltr"
                rows={4}
                placeholder="EYD1.eyJwYXlsb2FkIj...signature"
                value={token}
                onChange={(e) => {
                  setErrorMsg(null);
                  setToken(e.target.value);
                }}
                disabled={isLoading}
                className="w-full text-xs font-mono p-2.5 rounded-xl border border-surface-border bg-surface-card text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-navy resize-none"
              />
              <span className="text-[11px] text-text-secondary block">
                الصق كامل النص المشفر المستلم من ملف الترخيص الصادر من أداة الترخيص.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !token.trim()}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التحقق المحلي...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>تفعيل بالرمز دون اتصال</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
