import React, { useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useLicenseStore, PLAN_NAMES } from '@/store/useLicenseStore';
import { ActivationDialog } from './ActivationDialog';
import type { LicensePlan } from '../../../../shared/license';
import type { AboutAppInfo } from '../types';

interface AboutTabProps {
  info: AboutAppInfo;
}

export const AboutTab: React.FC<AboutTabProps> = ({ info }) => {
  const { showToast } = useToast();
  const { plan, planName, expiryDate, daysRemaining, licenseCode, customerName, setPlan } = useLicenseStore();
  const [isActivationOpen, setIsActivationOpen] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string>(info.changelog[0]?.version || 'v2.4.0');

  const handlePlanChange = (newPlan: LicensePlan) => {
    setPlan(newPlan);
    showToast({
      title: 'تغيير باقة الترخيص',
      description: `تم التبديل بنجاح إلى ${PLAN_NAMES[newPlan]} (${newPlan === 'basic' ? 'يتم قفل التأمين والمخزون' : 'جميع الميزات متاحة'}).`,
      variant: 'success',
    });
  };

  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    setUpdateStatus(null);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      setUpdateStatus('up_to_date');
      showToast({
        title: 'التحقق من التحديثات',
        description: 'أنت تستخدم أحدث إصدار معتمد من نظام عيادتي (v2.4.0)',
        variant: 'success',
      });
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. App Identity Card */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4 text-center md:text-right">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-navy to-blue-700 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
            ع
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h2 className="text-lg font-bold text-text-primary">{info.app_name}</h2>
              <Badge variant="info" className="font-mono">
                {info.version}
              </Badge>
              <Badge variant="ok">مستقر وموثق</Badge>
            </div>
            <p className="text-xs text-text-secondary">{info.edition}</p>
            <p className="text-[11px] text-text-secondary font-mono">
              رقم البناء: {info.build_number} • تاريخ الإصدار: {info.release_date}
            </p>
          </div>
        </div>

        {/* Check for updates action */}
        <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            loading={isCheckingUpdate}
            onClick={handleCheckUpdate}
            className="gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
            <span>التحقق من وجود تحديثات</span>
          </Button>

          {updateStatus === 'up_to_date' && (
            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              أنت تستخدم أحدث إصدار متاح حالياً
            </span>
          )}
        </div>
      </div>

      {/* 2. License Status Card */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border/60">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">بيانات الترخيص المؤسسي</h3>
              <p className="text-xs text-text-secondary">معلومات شهادة الترخيص المعتمدة لمنشأتك الطبية</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ترخيص نشط ومعتمد
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsActivationOpen(true)}
              className="gap-1.5 text-xs h-8"
            >
              <KeyRound className="w-3.5 h-3.5 text-brand-navy" />
              <span>تفعيل / تجديد الترخيص</span>
            </Button>
          </div>
        </div>

        {/* بطاقة الترخيص الحقيقية ونوع الباقة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-surface-ground border border-surface-border space-y-1">
            <span className="text-[11px] text-text-secondary block">المنشأة المرخصة:</span>
            <span className="font-bold text-text-primary">{customerName || 'عيادة د. أحمد الراشد لطب الأسنان'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-ground border border-surface-border space-y-1">
            <span className="text-[11px] text-text-secondary block">كود الترخيص (License Code):</span>
            <span className="font-bold font-mono text-brand-navy">{licenseCode || 'EYD-PROD-2026-ACTIVE'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-ground border border-surface-border space-y-1">
            <span className="text-[11px] text-text-secondary block">نوع الخطة (Plan):</span>
            <span className="font-bold text-brand-navy">{planName}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-ground border border-surface-border space-y-1">
            <span className="text-[11px] text-text-secondary block">صلاحية الترخيص:</span>
            <span className="font-bold text-emerald-700">نشط حتى {expiryDate} (متبقي {daysRemaining} يوم)</span>
          </div>
        </div>

        {/* خيارات تبديل الباقة للتجربة */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-text-secondary">
            <span className="font-bold text-text-primary">تبديل الباقة الفعالة للاختبار: </span>
            <span>(في الباقة الأساسية Basic يظهر قفل على التأمين والمخزون)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={plan === 'basic' ? 'primary' : 'outline'}
              onClick={() => handlePlanChange('basic')}
              className="text-xs h-8"
            >
              الباقة الأساسية (Basic)
            </Button>
            <Button
              size="sm"
              variant={plan === 'pro' ? 'primary' : 'outline'}
              onClick={() => handlePlanChange('pro')}
              className="text-xs h-8"
            >
              الباقة الاحترافية (Pro)
            </Button>
            <Button
              size="sm"
              variant={plan === 'enterprise' ? 'primary' : 'outline'}
              onClick={() => handlePlanChange('enterprise')}
              className="text-xs h-8"
            >
              باقة المنشآت (Enterprise)
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Changelog / Release History */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-surface-border/60">
          <Layers className="w-5 h-5 text-brand-navy" />
          <div>
            <h3 className="text-sm font-bold text-text-primary">سجل التحديثات والتغييرات (Changelog)</h3>
            <p className="text-xs text-text-secondary">تاريخ الإصدارات والميزات الجديدة والتحسينات المضافة</p>
          </div>
        </div>

        <div className="space-y-3">
          {info.changelog.map((entry) => {
            const isExpanded = expandedVersion === entry.version;
            return (
              <div
                key={entry.version}
                className="border border-surface-border rounded-xl overflow-hidden bg-surface-ground transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedVersion(isExpanded ? '' : entry.version)}
                  className="w-full p-4 flex items-center justify-between text-right hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs bg-brand-navy/10 text-brand-navy px-2.5 py-1 rounded-md">
                      {entry.version}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">{entry.title}</h4>
                      <span className="text-[10px] text-text-secondary">{entry.date}</span>
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-text-secondary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-secondary" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-surface-border/50 bg-white space-y-2">
                    <span className="text-[11px] font-bold text-text-secondary block">
                      أبرز ما تم إنجازه في هذا الإصدار:
                    </span>
                    <ul className="space-y-1.5 text-xs text-text-primary">
                      {entry.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="leading-relaxed">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center text-xs text-text-secondary py-3 flex items-center justify-center gap-1">
        <span>صُمم وطُوِّر خصيصاً لخدمة أطباء الأسنان والعيادات التخصصية</span>
        <span>•</span>
        <span>Eyadati Dental OS © 2026</span>
      </div>

      <ActivationDialog
        isOpen={isActivationOpen}
        onClose={() => setIsActivationOpen(false)}
      />
    </div>
  );
};
