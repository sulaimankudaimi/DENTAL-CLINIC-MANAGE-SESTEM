import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from './AuthContext';
import { api } from '@/lib/api';
import { validatePasswordPolicy } from '@shared/passwordPolicy';
import {
  Stethoscope,
  Building2,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';

// ================= SCHEMAS =================
const step1Schema = z.object({
  clinic_name: z
    .string()
    .min(2, 'اسم العيادة يجب أن يتكون من حرفين على الأقل')
    .max(120, 'اسم العيادة يجب ألا يتجاوز 120 حرفاً'),
  clinic_phone: z.string().optional(),
  clinic_city: z.string().optional(),
  clinic_tax_number: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || /^3\d{13}3$/.test(val.trim()),
      {
        message: 'الرقم الضريبي يجب أن يتكون من 15 رقماً ويبدأ وينتهي بالرقم 3',
      }
    ),
});

const step2Schema = z
  .object({
    owner_full_name: z
      .string()
      .min(2, 'الاسم الكامل يجب أن يتكون من حرفين على الأقل')
      .max(80, 'الاسم الكامل يجب ألا يتجاوز 80 حرفاً'),
    owner_username: z
      .string()
      .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
      .max(32, 'اسم المستخدم يجب ألا يتجاوز 32 حرفاً')
      .regex(
        /^[a-z0-9._]+$/,
        'اسم المستخدم يجب أن يتكون من أحرف إنجليزية صغيرة وأرقام ونقاط أو شرطة سفلية فقط'
      ),
    password: z.string().min(1, 'يرجى إدخال كلمة المرور'),
    confirm_password: z.string().min(1, 'يرجى تأكيد كلمة المرور'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['confirm_password'],
  })
  .superRefine((data, ctx) => {
    const policy = validatePasswordPolicy(data.password, data.owner_username);
    if (!policy.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: policy.error || 'كلمة المرور لا تستوفي معايير الأمان المعتمدة',
        path: ['password'],
      });
    }
  });

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

// Auto-suggest username helper
function suggestUsernameFromArabic(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (!parts[0]) return '';
  const firstWord = parts[0];

  const commonMap: Record<string, string> = {
    'أحمد': 'ahmed',
    'احمد': 'ahmed',
    'محمد': 'mohammed',
    'محمود': 'mahmoud',
    'علي': 'ali',
    'عبدالله': 'abdullah',
    'عبد': 'abdul',
    'خالد': 'khaled',
    'طارق': 'tareq',
    'سارة': 'sara',
    'ساره': 'sara',
    'ليلى': 'layla',
    'نورة': 'noura',
    'فاطمة': 'fatima',
    'مريم': 'maryam',
    'عمر': 'omar',
    'سعود': 'saud',
    'فيصل': 'faisal',
    'سلطان': 'sultan',
  };

  const stripped = firstWord.replace(/^د\.?\s*/, '');
  if (commonMap[stripped]) {
    return 'dr.' + commonMap[stripped];
  }

  // Basic transliteration
  const latin = stripped
    .replace(/[أإآا]/g, 'a')
    .replace(/[ب]/g, 'b')
    .replace(/[تة]/g, 't')
    .replace(/[ث]/g, 'th')
    .replace(/[ج]/g, 'j')
    .replace(/[ح]/g, 'h')
    .replace(/[خ]/g, 'kh')
    .replace(/[د]/g, 'd')
    .replace(/[ذ]/g, 'dh')
    .replace(/[ر]/g, 'r')
    .replace(/[ز]/g, 'z')
    .replace(/[س]/g, 's')
    .replace(/[ش]/g, 'sh')
    .replace(/[ص]/g, 's')
    .replace(/[ض]/g, 'd')
    .replace(/[ط]/g, 't')
    .replace(/[ظ]/g, 'z')
    .replace(/[ع]/g, 'a')
    .replace(/[غ]/g, 'gh')
    .replace(/[ف]/g, 'f')
    .replace(/[ق]/g, 'q')
    .replace(/[ك]/g, 'k')
    .replace(/[ل]/g, 'l')
    .replace(/[م]/g, 'm')
    .replace(/[ن]/g, 'n')
    .replace(/[ه]/g, 'h')
    .replace(/[و]/g, 'w')
    .replace(/[يىئ]/g, 'y')
    .replace(/[^a-z0-9]/g, '');

  if (latin.length >= 2) {
    return firstWord.startsWith('د') ? `dr.${latin}` : latin;
  }
  return 'owner';
}

function calculatePasswordStrength(password: string, username: string): {
  score: 1 | 2 | 3 | 4;
  label: string;
  colorClass: string;
} {
  if (!password) {
    return { score: 1, label: 'ضعيفة جداً', colorClass: 'bg-slate-200 text-text-muted' };
  }

  const policy = validatePasswordPolicy(password, username);
  if (!policy.valid) {
    return { score: 1, label: 'ضعيفة (غير مقبولة)', colorClass: 'bg-danger text-danger' };
  }

  let bonus = 0;
  if (password.length >= 12) bonus++;
  if (password.length >= 15) bonus++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) bonus++;
  if (/[^a-zA-Z0-9]/.test(password)) bonus++;

  if (bonus >= 3) {
    return { score: 4, label: 'قوية جداً وممتازة', colorClass: 'bg-emerald-500 text-emerald-600' };
  } else if (bonus >= 1) {
    return { score: 3, label: 'جيدة جداً', colorClass: 'bg-blue-500 text-blue-600' };
  }
  return { score: 2, label: 'مقبولة وتستوفي الشروط', colorClass: 'bg-amber-500 text-amber-600' };
}

export const SetupWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // In-memory wizard draft state (NOT in localStorage)
  const [draft, setDraft] = useState<{
    clinic: Step1Data;
    owner: Step2Data;
  }>({
    clinic: {
      clinic_name: '',
      clinic_phone: '',
      clinic_city: 'الرياض',
      clinic_tax_number: '',
    },
    owner: {
      owner_full_name: '',
      owner_username: '',
      password: '',
      confirm_password: '',
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameManuallyEdited, setUsernameManuallyEdited] = useState(false);

  // Form Step 1
  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: draft.clinic,
    mode: 'onTouched',
  });

  // Form Step 2
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: draft.owner,
    mode: 'onChange',
  });

  const watchedPassword = form2.watch('password') || '';
  const watchedUsername = form2.watch('owner_username') || '';
  const strength = calculatePasswordStrength(watchedPassword, watchedUsername);

  // Checklist live criteria
  const hasMinLength = watchedPassword.length >= 10;
  const hasLetter = /[a-zA-Z\u0600-\u06FF]/.test(watchedPassword);
  const hasNumber = /[0-9]/.test(watchedPassword);
  const notUsername =
    !watchedUsername ||
    (!watchedPassword.toLowerCase().includes(watchedUsername.toLowerCase()) &&
      watchedPassword.toLowerCase() !== watchedUsername.toLowerCase());
  const passesPolicy = validatePasswordPolicy(watchedPassword, watchedUsername).valid;

  // Handle Step 1 Next
  const handleStep1Submit = form1.handleSubmit((data) => {
    setDraft((prev) => ({ ...prev, clinic: data }));
    setCurrentStep(2);
  });

  // Handle Step 2 Next
  const handleStep2Submit = form2.handleSubmit((data) => {
    setDraft((prev) => ({ ...prev, owner: data }));
    setCurrentStep(3);
  });

  // Handle Full Setup Finish
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    const payload = {
      clinic: {
        name: draft.clinic.clinic_name.trim(),
        phone: draft.clinic.clinic_phone?.trim() || undefined,
        city: draft.clinic.clinic_city?.trim() || undefined,
        tax_number: draft.clinic.clinic_tax_number?.trim() || undefined,
      },
      owner: {
        full_name: draft.owner.owner_full_name.trim(),
        username: draft.owner.owner_username.trim().toLowerCase(),
        password: draft.owner.password,
      },
    };

    try {
      const res = await api.auth.setupFirstRun(payload);
      if (!res.ok) {
        setSubmissionError(res.error || 'فشل إعداد النظام');
        setIsSubmitting(false);
        return;
      }

      // Try auto-login
      const loginRes = await login({
        username: payload.owner.username,
        password: payload.owner.password,
      });

      if (loginRes.success) {
        navigate('/dashboard', { replace: true });
      } else {
        // Fallback to login with success notification state
        navigate('/login', {
          replace: true,
          state: {
            setupSuccess: true,
            message: 'تم إعداد النظام وإنشاء حساب المالك بنجاح! يمكنك الآن تسجيل الدخول.',
          },
        });
      }
    } catch (err: any) {
      setSubmissionError(err?.message || 'حدث خطأ غير متوقع أثناء إعداد النظام');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A0F1D] flex items-center justify-center p-4 md:p-6 select-none"
      dir="rtl"
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-700/30">
        {/* Header Branding */}
        <div className="p-6 md:p-8 bg-slate-50 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-blue flex items-center justify-center text-white shadow-md shadow-brand-blue/30">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-text-primary tracking-tight">
                عيادتي <span className="text-brand-blue text-sm font-bold">PRO</span>
              </h1>
              <p className="text-xs text-text-secondary">معالج التهيئة والإعداد الأولي للعيادة</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>إعداد للمرة الأولى</span>
          </div>
        </div>

        {/* Stepper Progress Header */}
        <div className="px-6 md:px-8 pt-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between relative">
            {/* Progress bar line */}
            <div className="absolute top-1/2 -translate-y-1/2 start-8 end-8 h-1 bg-slate-100 -z-0">
              <div
                className="h-full bg-brand-blue transition-all duration-300"
                style={{
                  width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
                }}
              />
            </div>

            {/* Step 1 indicator */}
            <div className="flex flex-col items-center gap-1.5 z-10 bg-white px-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep >= 1
                    ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30 ring-4 ring-brand-blue/10'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                1
              </div>
              <span className={`text-[11px] font-bold ${currentStep === 1 ? 'text-brand-blue' : 'text-text-muted'}`}>
                بيانات العيادة
              </span>
            </div>

            {/* Step 2 indicator */}
            <div className="flex flex-col items-center gap-1.5 z-10 bg-white px-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep >= 2
                    ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30 ring-4 ring-brand-blue/10'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                2
              </div>
              <span className={`text-[11px] font-bold ${currentStep === 2 ? 'text-brand-blue' : 'text-text-muted'}`}>
                حساب المالك
              </span>
            </div>

            {/* Step 3 indicator */}
            <div className="flex flex-col items-center gap-1.5 z-10 bg-white px-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 3
                    ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30 ring-4 ring-brand-blue/10'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                3
              </div>
              <span className={`text-[11px] font-bold ${currentStep === 3 ? 'text-brand-blue' : 'text-text-muted'}`}>
                مراجعة وتأكيد
              </span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 md:p-8">
          {submissionError && (
            <div className="mb-6 p-3.5 bg-danger-light border border-danger/30 rounded-2xl flex items-center gap-3 text-xs text-danger font-medium animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{submissionError}</span>
            </div>
          )}

          {/* STEP 1: بيانات العيادة */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="mb-2">
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-blue" />
                  <span>الخطوة 1: البيانات الأساسية للعيادة</span>
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  أدخل اسم العيادة والبيانات النظامية لظهورها في ترويسة الفواتير والمطبوعات
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  اسم العيادة أو المركز الطبي <span className="text-danger">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="مثال: مجمع ابتسامة النخبة لطب الأسنان"
                  className="h-11 bg-slate-50/70 border-border focus:bg-white text-xs"
                  autoFocus
                  {...form1.register('clinic_name')}
                  error={form1.formState.errors.clinic_name?.message}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">
                    المدينة
                  </label>
                  <Input
                    type="text"
                    placeholder="الرياض، جدة، الدمام..."
                    className="h-11 bg-slate-50/70 border-border focus:bg-white text-xs"
                    {...form1.register('clinic_city')}
                    error={form1.formState.errors.clinic_city?.message}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">
                    هاتف التواصل
                  </label>
                  <Input
                    type="text"
                    placeholder="0501234567 أو 0114000000"
                    dir="ltr"
                    className="h-11 bg-slate-50/70 border-border focus:bg-white text-xs text-right"
                    {...form1.register('clinic_phone')}
                    error={form1.formState.errors.clinic_phone?.message}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  الرقم الضريبي VAT (اختياري)
                </label>
                <Input
                  type="text"
                  placeholder="15 رقماً يبدأ وينتهي بـ 3 (مثال: 300000000000003)"
                  dir="ltr"
                  className="h-11 bg-slate-50/70 border-border focus:bg-white text-xs text-right font-mono"
                  {...form1.register('clinic_tax_number')}
                  error={form1.formState.errors.clinic_tax_number?.message}
                />
                <p className="text-[11px] text-text-muted mt-1">
                  يمكنك إضافة الرقم الضريبي لاحقاً من شاشة الإعدادات إذا لم يكن جاهزاً الآن
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  className="h-11 px-6 font-bold text-xs gap-2 shadow-md shadow-brand-blue/20"
                >
                  <span>متابعة لحساب المالك</span>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: حساب المالك */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div className="mb-2">
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-blue" />
                  <span>الخطوة 2: حساب مالك العيادة (المدير العام)</span>
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  الحساب الرئيسي ذو الصلاحيات الكاملة لإدارة الأطباء والموظفين والمالية
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  الاسم الكامل للمالك أو الطبيب المسؤول <span className="text-danger">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="مثال: د. أحمد خالد الراشد"
                  className="h-11 bg-slate-50/70 border-border focus:bg-white text-xs"
                  autoFocus
                  {...form2.register('owner_full_name', {
                    onChange: (e) => {
                      if (!usernameManuallyEdited) {
                        const suggested = suggestUsernameFromArabic(e.target.value);
                        form2.setValue('owner_username', suggested, { shouldValidate: true });
                      }
                    },
                  })}
                  error={form2.formState.errors.owner_full_name?.message}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-text-primary">
                    اسم المستخدم لتسجيل الدخول <span className="text-danger">*</span>
                  </label>
                  <span className="text-[11px] text-text-muted">
                    يُقترح تلقائياً ويمكنك تغييره
                  </span>
                </div>
                <Input
                  type="text"
                  dir="ltr"
                  placeholder="dr.ahmed"
                  className="h-11 bg-slate-50/70 border-border focus:bg-white text-xs font-mono text-left"
                  {...form2.register('owner_username', {
                    onChange: () => setUsernameManuallyEdited(true),
                  })}
                  error={form2.formState.errors.owner_username?.message}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">
                    كلمة المرور الرئيسية <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      className="h-11 pe-10 bg-slate-50/70 border-border focus:bg-white text-xs tracking-wider"
                      {...form2.register('password')}
                      error={form2.formState.errors.password?.message}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">
                    تأكيد كلمة المرور <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      className="h-11 pe-10 bg-slate-50/70 border-border focus:bg-white text-xs tracking-wider"
                      {...form2.register('confirm_password')}
                      error={form2.formState.errors.confirm_password?.message}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Indicator */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-border space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text-secondary flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-brand-blue" />
                    مؤشر قوة كلمة المرور:
                  </span>
                  <span className="font-bold text-[11px]">{strength.label}</span>
                </div>

                {/* 4 segments meter */}
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  <div
                    className={`rounded-full transition-all ${
                      strength.score >= 1 ? strength.colorClass : 'bg-slate-200'
                    }`}
                  />
                  <div
                    className={`rounded-full transition-all ${
                      strength.score >= 2 ? strength.colorClass : 'bg-slate-200'
                    }`}
                  />
                  <div
                    className={`rounded-full transition-all ${
                      strength.score >= 3 ? strength.colorClass : 'bg-slate-200'
                    }`}
                  />
                  <div
                    className={`rounded-full transition-all ${
                      strength.score >= 4 ? strength.colorClass : 'bg-slate-200'
                    }`}
                  />
                </div>

                {/* Live Requirements Checklist */}
                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-bold' : 'text-text-muted'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>10 أحرف أو أكثر</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLetter ? 'text-emerald-700 font-bold' : 'text-text-muted'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasLetter ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>حرف واحد على الأقل</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-bold' : 'text-text-muted'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${hasNumber ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>رقم واحد على الأقل</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${notUsername ? 'text-emerald-700 font-bold' : 'text-text-muted'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${notUsername ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>لا تحتوي على اسم المستخدم</span>
                  </div>
                  <div className={`flex items-center gap-1.5 md:col-span-2 ${passesPolicy ? 'text-emerald-700 font-bold' : 'text-text-muted'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${passesPolicy ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>ليست كلمة مرور شائعة وتستوفي معايير الأمان</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-5 font-bold text-xs gap-2"
                  onClick={() => {
                    setDraft((prev) => ({ ...prev, owner: form2.getValues() }));
                    setCurrentStep(1);
                  }}
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>رجوع للعيادة</span>
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  className="h-11 px-6 font-bold text-xs gap-2 shadow-md shadow-brand-blue/20"
                >
                  <span>مراجعة وتأكيد</span>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: مراجعة وتأكيد */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="mb-2">
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-blue" />
                  <span>الخطوة 3: مراجعة البيانات وتأكيد التأسيس</span>
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  تأكد من صحة البيانات المدخلة قبل بناء قاعدة البيانات وتوليد جداول النظام
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-border space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-navy pb-2 border-b border-border">
                    <Building2 className="w-4 h-4 text-brand-blue" />
                    <span>بيانات العيادة</span>
                  </div>
                  <div className="text-xs space-y-1 pt-1">
                    <p className="text-text-primary font-bold">{draft.clinic.clinic_name}</p>
                    <p className="text-text-secondary">
                      <span className="text-text-muted">المدينة: </span>
                      {draft.clinic.clinic_city || 'غير محدد'}
                    </p>
                    <p className="text-text-secondary">
                      <span className="text-text-muted">الهاتف: </span>
                      {draft.clinic.clinic_phone || 'غير محدد'}
                    </p>
                    <p className="text-text-secondary font-mono text-[11px]">
                      <span className="text-text-muted font-sans text-xs">الرقم الضريبي: </span>
                      {draft.clinic.clinic_tax_number || 'غير مسجل'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-border space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-navy pb-2 border-b border-border">
                    <User className="w-4 h-4 text-brand-blue" />
                    <span>حساب المالك الرئيسي</span>
                  </div>
                  <div className="text-xs space-y-1 pt-1">
                    <p className="text-text-primary font-bold">{draft.owner.owner_full_name}</p>
                    <p className="text-text-secondary font-mono text-[11px]">
                      <span className="text-text-muted font-sans text-xs">اسم المستخدم: </span>
                      {draft.owner.owner_username}
                    </p>
                    <p className="text-text-secondary">
                      <span className="text-text-muted">الدور: </span>
                      مالك العيادة (كامل الصلاحيات)
                    </p>
                    <p className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>كلمة المرور مشفرة ومؤمنة (Bcrypt 12)</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning Banner Required */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-amber-900 text-xs leading-relaxed">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-0.5">تنبيه أمان بالغ الأهمية:</p>
                  <p>
                    احتفظ بكلمة المرور في مكان آمن. لا توجد طريقة لاستعادتها إن فُقدت نظراً لأن قاعدة البيانات
                    محلية بالكامل ومحكومة بتشفير صارم وغير متصلة بأي خادم سحابي خارجي.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/60 flex items-center gap-2.5 text-xs text-brand-navy">
                <Info className="w-4 h-4 text-brand-blue shrink-0" />
                <span>
                  سيقوم النظام تلقائياً بتهيئة 60 إجراء سنّي مرجعي، وفهرس الأسنان FDI، ومصفوفة الصلاحيات النظامية.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-5 font-bold text-xs gap-2"
                  disabled={isSubmitting}
                  onClick={() => setCurrentStep(2)}
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>رجوع لتعديل الحساب</span>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  className="h-11 px-7 font-bold text-xs gap-2 shadow-lg shadow-brand-blue/30"
                  loading={isSubmitting}
                  onClick={handleFinalSubmit}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>إنشاء النظام والدخول</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupWizardPage;
