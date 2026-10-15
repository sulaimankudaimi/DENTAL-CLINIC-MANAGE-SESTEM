import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Lock,
  KeyRound,
  ExternalLink,
  Stethoscope,
  HeartHandshake,
  CreditCard,
  UserCheck,
  Save,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { useRbac } from '@/features/auth/RbacContext';
import { api } from '@/lib/api';

export const UsersRolesTab: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { policies, updatePolicies } = useRbac();

  const [isSavingPolicies, setIsSavingPolicies] = useState(false);
  const [restrictToOwn, setRestrictToOwn] = useState(false);
  const [idleTimeout, setIdleTimeout] = useState(15);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [lockoutMins, setLockoutMins] = useState(15);
  const [hidePrices, setHidePrices] = useState(false);
  const [hideClinical, setHideClinical] = useState(true);

  useEffect(() => {
    if (policies) {
      setRestrictToOwn(Boolean(policies.dentist_only_own_patients));
      setIdleTimeout(Number(policies.idle_timeout_minutes) || 15);
      setMaxAttempts(Number(policies.max_failed_attempts) || 5);
      setLockoutMins(Number(policies.lockout_duration_minutes) || 15);
      setHidePrices(Boolean(policies.receptionist_hide_prices));
      setHideClinical(policies.accountant_hide_clinical_notes !== false);
    }
  }, [policies]);

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPolicies(true);
    try {
      const updated = {
        ...policies,
        dentist_only_own_patients: restrictToOwn,
        idle_timeout_minutes: idleTimeout,
        max_failed_attempts: maxAttempts,
        lockout_duration_minutes: lockoutMins,
        receptionist_hide_prices: hidePrices,
        accountant_hide_clinical_notes: hideClinical,
      };

      await updatePolicies(updated);
      await api.settings.setSetting('security_policies', updated as any);

      showToast({
        title: 'تم حفظ السياسات الأمنية',
        description: 'تم تحديث سياسات الأمان وقيود الأطباء ومهلة الخمول فورياً',
        variant: 'success',
      });
    } catch {
      showToast({
        title: 'خطأ',
        description: 'فشل حفظ السياسات الأمنية',
        variant: 'error',
      });
    } finally {
      setIsSavingPolicies(false);
    }
  };

  const roleCards = [
    {
      role: 'admin',
      nameAr: 'المدير العام والمشرف',
      count: 2,
      desc: 'صلاحيات كاملة غير مقيدة على كافة الملفات، الإعدادات، والتقارير المالية',
      icon: ShieldCheck,
      color: 'text-purple-700 bg-purple-50 border-purple-200',
    },
    {
      role: 'dentist',
      nameAr: 'طبيب أسنان واستشاري',
      count: 4,
      desc: 'إدارة خطط العلاج، مخطط الأسنان التفاعلي، الروشتات، وطلب الأشعة',
      icon: Stethoscope,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    {
      role: 'nurse',
      nameAr: 'تمريض ومساعد طبيب',
      count: 3,
      desc: 'تجهيز الكراسي، تسجيل العلامات الحيوية، وتحديث استهلاك المواد',
      icon: HeartHandshake,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      role: 'receptionist',
      nameAr: 'استقبال وخدمة مرضى',
      count: 3,
      desc: 'تسجيل المرضى الجدد، جدولة المواعيد، وتسجيل الحضور والانصراف',
      icon: UserCheck,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      role: 'accountant',
      nameAr: 'محاسب ومدير مالي',
      count: 1,
      desc: 'إصدار الفواتير الضريبية ZATCA، سندات القبض، ومتابعة المطالبات',
      icon: CreditCard,
      color: 'text-teal-700 bg-teal-50 border-teal-200',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header with Navigation Link */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">المستخدمون والأدوار ومصفوفة الصلاحيات (RBAC)</h2>
            <p className="text-xs text-text-secondary">
              مرتبط بالنظام الأمني الموحد (P19) لإدارة حسابات الأطباء والموظفين وتشفير كلمات المرور محلياً
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/staff?tab=permissions')}
            className="gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>مصفوفة الصلاحيات</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/staff?tab=users')}
            className="gap-1.5"
          >
            <span>إدارة الحسابات والطاقم</span>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Role Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roleCards.map((rc) => {
          const Icon = rc.icon;
          return (
            <div
              key={rc.role}
              className="bg-surface-card rounded-2xl border border-surface-border p-5 space-y-3 hover:shadow-xs transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${rc.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text-primary">{rc.nameAr}</h3>
                    <span className="text-[10px] text-text-secondary font-mono">{rc.role}</span>
                  </div>
                </div>

                <Badge variant="neutral" className="font-bold">
                  {rc.count} مستخدم
                </Badge>
              </div>

              <p className="text-[11px] text-text-secondary leading-relaxed bg-surface-ground p-2.5 rounded-xl border border-surface-border/40">
                {rc.desc}
              </p>

              <div className="pt-2 flex items-center justify-between text-[11px] text-brand-navy font-bold">
                <button
                  type="button"
                  onClick={() => navigate(`/staff?tab=users&role=${rc.role}`)}
                  className="hover:underline flex items-center gap-1"
                >
                  <span>عرض أعضاء هذا الدور</span>
                  <span>←</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Security Policies Configuration */}
      <form onSubmit={handleSavePolicies} className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-navy flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">إعدادات السياسات الأمنية وقفل الجلسات (Security Policies)</h3>
              <p className="text-xs text-text-secondary">تُحفظ في قاعدة البيانات وتؤثر لحظياً على قنوات IPC وسلوك الجلسات</p>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isSavingPolicies}
            className="gap-2 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>حفظ السياسات الأمنية</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Switch 1: restrict_to_own_patients */}
          <div className="p-4 rounded-xl border border-surface-border bg-surface-ground space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-brand-navy" />
                  <span>حصر طبيب الأسنان بمرضاه فقط (Restrict to Own Patients)</span>
                </h4>
                <p className="text-[11px] text-text-secondary mt-1">
                  عند التفعيل، لا يستطيع طبيب الأسنان استعراض سجلات أو مواعيد أو فواتير إلا للمرضى المسندين إليه أو الذين عالجهم.
                </p>
              </div>
              <Switch
                checked={restrictToOwn}
                onCheckedChange={setRestrictToOwn}
              />
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              المفتاح: <span className="font-bold">restrict_to_own_patients</span>
            </div>
          </div>

          {/* Switch 2: receptionist_hide_prices */}
          <div className="p-4 rounded-xl border border-surface-border bg-surface-ground space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>حجب أسعار الخدمات عن موظفي الاستقبال</span>
                </h4>
                <p className="text-[11px] text-text-secondary mt-1">
                  إخفاء المبالغ والتسعيرات في كتالوج الخدمات عن دور الاستقبال وقصرها على المحاسب والإدارة.
                </p>
              </div>
              <Switch
                checked={hidePrices}
                onCheckedChange={setHidePrices}
              />
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              المفتاح: <span className="font-bold">receptionist_hide_prices</span>
            </div>
          </div>

          {/* Switch 3: accountant_hide_clinical_notes */}
          <div className="p-4 rounded-xl border border-surface-border bg-surface-ground space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  <span>حجب الملاحظات السريرية عن المحاسب المالي</span>
                </h4>
                <p className="text-[11px] text-text-secondary mt-1">
                  منع المحاسب من الاطلاع على الملاحظات الطبية ومخطط الأسنان، وقصر وصوله على البيانات المالية فقط.
                </p>
              </div>
              <Switch
                checked={hideClinical}
                onCheckedChange={setHideClinical}
              />
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              المفتاح: <span className="font-bold">accountant_hide_clinical_notes</span>
            </div>
          </div>

          {/* Numeric Config: Session Idle Timeout */}
          <div className="p-4 rounded-xl border border-surface-border bg-surface-ground space-y-3">
            <div>
              <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>مهلة الخمول وقفل الشاشة التلقائي (بالدقائق)</span>
              </h4>
              <p className="text-[11px] text-text-secondary mt-1">
                تحديد المدة الزمنية قبل قفل الشاشة وإلغاء الجلسة عند عدم وجود نشاط من المستخدم.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={idleTimeout}
                onChange={(e) => setIdleTimeout(Number(e.target.value))}
                className="w-full text-xs font-medium bg-white border border-surface-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-navy"
              >
                <option value={5}>5 دقائق</option>
                <option value={10}>10 دقائق</option>
                <option value={15}>15 دقيقة (افتراضي موصى به)</option>
                <option value={20}>20 دقيقة</option>
                <option value={30}>30 دقيقة</option>
                <option value={60}>60 دقيقة</option>
              </select>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              المفتاح: <span className="font-bold">idle_timeout_minutes</span>
            </div>
          </div>

          {/* Numeric Config: Max Failed Login Attempts */}
          <div className="p-4 rounded-xl border border-surface-border bg-surface-ground space-y-3">
            <div>
              <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-600" />
                <span>الحد الأقصى لمحاولات تسجيل الدخول الخاطئة</span>
              </h4>
              <p className="text-[11px] text-text-secondary mt-1">
                عدد مرات إدخال كلمة المرور الخاطئة المسموح بها قبل حظر الحساب مؤقتاً.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                className="w-full text-xs font-medium bg-white border border-surface-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-navy"
              >
                <option value={3}>3 محاولات (أمان مرتفع)</option>
                <option value={5}>5 محاولات (افتراضي)</option>
                <option value={10}>10 محاولات</option>
              </select>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              المفتاح: <span className="font-bold">max_failed_attempts</span>
            </div>
          </div>

          {/* Numeric Config: Lockout Duration */}
          <div className="p-4 rounded-xl border border-surface-border bg-surface-ground space-y-3">
            <div>
              <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-600" />
                <span>مدة الحظر المؤقت بعد تجاوز المحاولات (بالدقائق)</span>
              </h4>
              <p className="text-[11px] text-text-secondary mt-1">
                فترة الانتظار الإلزامية قبل السماح بمحاولة تسجيل الدخول مرة أخرى.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={lockoutMins}
                onChange={(e) => setLockoutMins(Number(e.target.value))}
                className="w-full text-xs font-medium bg-white border border-surface-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-navy"
              >
                <option value={5}>5 دقائق</option>
                <option value={15}>15 دقيقة (افتراضي)</option>
                <option value={30}>30 دقيقة</option>
                <option value={60}>60 دقيقة</option>
              </select>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              المفتاح: <span className="font-bold">lockout_duration_minutes</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
