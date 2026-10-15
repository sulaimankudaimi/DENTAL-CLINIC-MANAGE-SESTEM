import type { InsuranceClaimStatus } from '@shared/contracts';

export const CLAIM_STATUS_MAP: Record<
  InsuranceClaimStatus,
  { label: string; tone: 'neutral' | 'blue' | 'amber' | 'green' | 'emerald' | 'rose' | 'purple'; description: string }
> = {
  draft: {
    label: 'مسودة',
    tone: 'neutral',
    description: 'تم إنشاء المطالبة ولم يتم إرسالها لشركة التأمين بعد',
  },
  submitted: {
    label: 'مقدّمة',
    tone: 'blue',
    description: 'تم تقديم المطالبة لشركة التأمين وبانتظار الرد',
  },
  pre_approved: {
    label: 'موافقة مسبقة',
    tone: 'purple',
    description: 'تمت الموافقة المسبقة على الخطة العلاجية من شركة التأمين',
  },
  approved: {
    label: 'معتمدة بالكامل',
    tone: 'green',
    description: 'وافقت شركة التأمين على صرف كامل المبلغ المطالب به',
  },
  partially_approved: {
    label: 'معتمدة جزئياً',
    tone: 'amber',
    description: 'تم اعتماد جزء من المبلغ مع استقطاع نسبة التحمل أو بنود غير مشمولة',
  },
  rejected: {
    label: 'مرفوضة',
    tone: 'rose',
    description: 'رفضت شركة التأمين تغطية المطالبة أو استنفاد السقف السنوي',
  },
  paid: {
    label: 'مدفوعة ومحصّلة',
    tone: 'emerald',
    description: 'تم تحويل وسداد المبلغ المعتمد من قبل شركة التأمين إلى حساب العيادة',
  },
};

export const COMMON_EXCLUDED_PROCEDURES = [
  'تبييض الأسنان بالليزر',
  'ابتسامة هوليوود (فينير)',
  'تقويم الأسنان التجميلي',
  'زراعة الأسنان التجميلية',
  'عدسات الأسنان Lumineers',
  'تركيبات الزيركون التجميلية للأغراض غير العلاجية',
  'قص وتجميل اللثة بالليزر لأغراض تجميلية',
];
