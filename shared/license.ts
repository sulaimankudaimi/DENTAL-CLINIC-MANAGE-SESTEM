/**
 * نظام التراخيص - الوحدة المشتركة (Shared Pure Module)
 * وحدة نقية 100% تعمل في الواجهة الأمامية والخلفية دون أي اعتماديات خارجية أو تبعية لـ Node/Electron.
 */

export type LicensePlan = 'basic' | 'pro' | 'enterprise';

export type LicenseFeature =
  | 'patients'
  | 'appointments'
  | 'treatments'
  | 'billing'
  | 'odontogram'
  | 'imaging'
  | 'prescriptions'
  | 'inventory'
  | 'insurance'
  | 'lab_orders'
  | 'reports_basic'
  | 'reports_advanced'
  | 'audit_log'
  | 'multi_doctor'
  | 'data_export'
  | 'zatca_einvoice';

export interface LicenseLimits {
  max_doctors: number | null;
  max_patients: number | null;
  max_devices?: number | null;
}

export interface PlanDefinition {
  plan: LicensePlan;
  name_ar: string;
  default_features: LicenseFeature[];
  limits: LicenseLimits;
}

export const PLAN_DEFS: Record<LicensePlan, PlanDefinition> = {
  basic: {
    plan: 'basic',
    name_ar: 'الباقة الأساسية',
    default_features: [
      'patients',
      'appointments',
      'treatments',
      'billing',
      'odontogram',
      'prescriptions',
      'reports_basic',
    ],
    limits: {
      max_doctors: 1,
      max_patients: 1000,
      max_devices: 1,
    },
  },
  pro: {
    plan: 'pro',
    name_ar: 'الباقة الاحترافية (Pro)',
    default_features: [
      'patients',
      'appointments',
      'treatments',
      'billing',
      'odontogram',
      'imaging',
      'prescriptions',
      'inventory',
      'insurance',
      'lab_orders',
      'reports_basic',
      'reports_advanced',
      'audit_log',
      'multi_doctor',
      'data_export',
      'zatca_einvoice',
    ],
    limits: {
      max_doctors: 5,
      max_patients: null,
      max_devices: 5,
    },
  },
  enterprise: {
    plan: 'enterprise',
    name_ar: 'باقة المنشآت والمجموعات (Enterprise)',
    default_features: [
      'patients',
      'appointments',
      'treatments',
      'billing',
      'odontogram',
      'imaging',
      'prescriptions',
      'inventory',
      'insurance',
      'lab_orders',
      'reports_basic',
      'reports_advanced',
      'audit_log',
      'multi_doctor',
      'data_export',
      'zatca_einvoice',
    ],
    limits: {
      max_doctors: null,
      max_patients: null,
      max_devices: null,
    },
  },
};

export interface LicensePayload {
  version: number;
  customer: string;
  plan: LicensePlan;
  fingerprint: string;
  expires_at: string; // ISO 8601
  issued_at: string; // ISO 8601
  max_doctors?: number | null;
  max_devices?: number | null;
  features?: LicenseFeature[];
}

export type LicenseState =
  | 'active'
  | 'trial'
  | 'grace'
  | 'read_only'
  | 'invalid'
  | 'clock_tampered';

export interface LicenseStatus {
  state: LicenseState;
  plan: LicensePlan;
  customer: string;
  expires_at: string | null;
  days_left: number;
  grace_days_left: number;
  features: LicenseFeature[];
  limits: {
    max_doctors: number | null;
    max_patients: number | null;
  };
  message_ar: string;
  can_write: boolean;
}

export interface EvaluateLicenseInput {
  payload: LicensePayload | null;
  trial_started_at: string | null;
  last_seen_at: string | null;
  fingerprint_matches: boolean | null;
  signature_valid: boolean | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * دالة تقييم حالة الترخيص النقية (Pure Function)
 * تطبق القواعد بالترتيب الصارم:
 * 1) تلاعب الساعة: now < last_seen_at - 24 ساعة -> clock_tampered (can_write=false)
 * 2) رمز موجود وتوقيعه غير صالح أو البصمة غير مطابقة -> invalid (can_write=false)
 * 3) رمز صالح: قبل expires_at -> active؛ خلال 7 أيام بعدها -> grace؛ بعدها -> read_only
 * 4) لا رمز: تجربة ضمن 14 يوماً من trial_started_at -> trial؛ بعدها -> read_only
 * 5) لا رمز ولا تجربة -> read_only مع رسالة "لم يبدأ الترخيص"
 */
export function evaluateLicense(
  input: EvaluateLicenseInput,
  now: Date | string | number = new Date()
): LicenseStatus {
  const nowDate = typeof now === 'object' ? now : new Date(now);
  const nowMs = nowDate.getTime();

  // القاعدة (1): التلاعب بالساعة (الرجوع للخلف أكثر من 24 ساعة عن آخر ظهور مسجل)
  if (input.last_seen_at) {
    const lastSeenMs = new Date(input.last_seen_at).getTime();
    if (nowMs < lastSeenMs - MS_PER_DAY) {
      const plan = input.payload?.plan || 'basic';
      return {
        state: 'clock_tampered',
        plan,
        customer: input.payload?.customer || '',
        expires_at: input.payload?.expires_at || null,
        days_left: 0,
        grace_days_left: 0,
        features: input.payload?.features || PLAN_DEFS[plan]?.default_features || [],
        limits: {
          max_doctors: input.payload?.max_doctors ?? PLAN_DEFS[plan]?.limits.max_doctors ?? null,
          max_patients: PLAN_DEFS[plan]?.limits.max_patients ?? null,
        },
        message_ar: 'تم رصد تلاعب في توقيت النظام أو الساعة. يُرجى ضبط الوقت والتاريخ للمتابعة.',
        can_write: false,
      };
    }
  }

  // القاعدة (2): رمز موجود وتوقيعه غير صالح أو البصمة غير مطابقة
  if (input.payload !== null) {
    if (input.signature_valid === false || input.fingerprint_matches === false) {
      const plan = input.payload.plan;
      const reason =
        input.signature_valid === false
          ? 'رمز الترخيص غير صالح أو توقيعه الرقمي تالف.'
          : 'رمز الترخيص غير مخصص لهذا الجهاز (عدم تطابق بصمة الجهاز).';
      return {
        state: 'invalid',
        plan,
        customer: input.payload.customer,
        expires_at: input.payload.expires_at,
        days_left: 0,
        grace_days_left: 0,
        features: input.payload.features || PLAN_DEFS[plan]?.default_features || [],
        limits: {
          max_doctors: input.payload.max_doctors ?? PLAN_DEFS[plan]?.limits.max_doctors ?? null,
          max_patients: PLAN_DEFS[plan]?.limits.max_patients ?? null,
        },
        message_ar: reason,
        can_write: false,
      };
    }

    // القاعدة (3): رمز صالح
    const expiresMs = new Date(input.payload.expires_at).getTime();
    const diffMs = expiresMs - nowMs;
    const days_left = Math.ceil(diffMs / MS_PER_DAY);
    const plan = input.payload.plan;
    const features = input.payload.features || PLAN_DEFS[plan]?.default_features || [];
    const limits = {
      max_doctors: input.payload.max_doctors ?? PLAN_DEFS[plan]?.limits.max_doctors ?? null,
      max_patients: PLAN_DEFS[plan]?.limits.max_patients ?? null,
    };

    if (nowMs <= expiresMs) {
      return {
        state: 'active',
        plan,
        customer: input.payload.customer,
        expires_at: input.payload.expires_at,
        days_left: Math.max(0, days_left),
        grace_days_left: 7,
        features,
        limits,
        message_ar: 'الترخيص نشط ومعتمد.',
        can_write: true,
      };
    }

    // انتهاء الصلاحية: التحقق من فترة السماح (7 أيام بعد expires_at)
    const graceEndMs = expiresMs + 7 * MS_PER_DAY;
    if (nowMs <= graceEndMs) {
      const graceDiffMs = graceEndMs - nowMs;
      const grace_days_left = Math.max(0, Math.ceil(graceDiffMs / MS_PER_DAY));
      return {
        state: 'grace',
        plan,
        customer: input.payload.customer,
        expires_at: input.payload.expires_at,
        days_left: 0,
        grace_days_left,
        features,
        limits,
        message_ar: `انتهت صلاحية الترخيص. أنت حالياً في فترة السماح (متبقي ${grace_days_left} يوم). يرجى التجديد لتجنب إيقاف العمليات.`,
        can_write: true,
      };
    }

    // بعد انتهاء فترة السماح -> read_only
    return {
      state: 'read_only',
      plan,
      customer: input.payload.customer,
      expires_at: input.payload.expires_at,
      days_left: 0,
      grace_days_left: 0,
      features,
      limits,
      message_ar: 'انتهت صلاحية الترخيص وفترة السماح. النظام حالياً في وضع القراءة فقط.',
      can_write: false,
    };
  }

  // لا يوجد رمز
  // القاعدة (4): تجربة سارية ضمن 14 يوماً من trial_started_at
  if (input.trial_started_at) {
    const trialStartMs = new Date(input.trial_started_at).getTime();
    const trialEndMs = trialStartMs + 14 * MS_PER_DAY;
    const trialDiffMs = trialEndMs - nowMs;
    const days_left = Math.ceil(trialDiffMs / MS_PER_DAY);

    if (nowMs <= trialEndMs) {
      return {
        state: 'trial',
        plan: 'pro',
        customer: 'نسخة تجريبية',
        expires_at: new Date(trialEndMs).toISOString(),
        days_left: Math.max(0, days_left),
        grace_days_left: 0,
        features: PLAN_DEFS.pro.default_features,
        limits: {
          max_doctors: 2,
          max_patients: 100,
        },
        message_ar: `أنت في الفترة التجريبية (متبقي ${Math.max(0, days_left)} يوماً).`,
        can_write: true,
      };
    }

    // انتهت الـ 14 يوماً
    return {
      state: 'read_only',
      plan: 'pro',
      customer: 'نسخة تجريبية منتهية',
      expires_at: new Date(trialEndMs).toISOString(),
      days_left: 0,
      grace_days_left: 0,
      features: PLAN_DEFS.pro.default_features,
      limits: {
        max_doctors: 2,
        max_patients: 100,
      },
      message_ar: 'انتهت الفترة التجريبية (14 يوماً). النظام في وضع القراءة فقط.',
      can_write: false,
    };
  }

  // القاعدة (5): لا رمز ولا تجربة
  return {
    state: 'read_only',
    plan: 'basic',
    customer: '',
    expires_at: null,
    days_left: 0,
    grace_days_left: 0,
    features: [],
    limits: {
      max_doctors: 0,
      max_patients: 0,
    },
    message_ar: 'لم يبدأ الترخيص',
    can_write: false,
  };
}

/**
 * فحص الصلاحية الإجرائية بناءً على الترخيص
 */
export function isActionAllowed(
  status: LicenseStatus,
  resource: string,
  action: string,
  featureKey?: LicenseFeature
): { allowed: boolean; reason?: string } {
  // إذا كان النظام مغلقاً عن الكتابة (can_write=false):
  // يُسمح فقط بإجراءات العرض والتصدير ('view', 'export')
  // أو الموارد الإدارية الأساسية الخاصة بالترخيص والنسخ الاحتياطي والمصادقة
  if (!status.can_write) {
    const isControlResource = ['auth', 'license', 'backup', 'system'].includes(resource);
    const isReadOnlyAction = ['view', 'export', 'list', 'get', 'check'].includes(action);

    if (!isControlResource && !isReadOnlyAction) {
      return {
        allowed: false,
        reason: `النظام في وضع القراءة فقط (${status.message_ar}). يرجى تفعيل أو تجديد الترخيص لإجراء العمليات.`,
      };
    }
  }

  // التحقق من اشتمال الباقة على الميزة المطلوبة
  if (featureKey && !status.features.includes(featureKey)) {
    return {
      allowed: false,
      reason: 'هذه الميزة غير متضمنة في باقتك الحالية',
    };
  }

  return { allowed: true };
}

/**
 * تنسيق بصمة الجهاز لعرضها للمستخدم:
 * يعرض أول 20 حرفاً كبيرة مقسمة مجموعات من 4 بينها شرطة (مثال: A1B2-C3D4-E5F6-7890-ABCD)
 */
export function formatDeviceCode(hex: string): string {
  if (!hex || typeof hex !== 'string') return '';
  const clean = hex.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20).toUpperCase();
  const chunks = clean.match(/.{1,4}/g) || [];
  return chunks.join('-');
}
