import type { ToothCondition, ToothRecordStatus } from '@shared/contracts';

export interface ConditionColorConfig {
  condition: ToothCondition;
  label_ar: string;
  label_en: string;
  fill: string;
  stroke: string;
  text_color: string;
  bg_class: string;
  border_class: string;
  badge_variant: 'default' | 'success' | 'warning' | 'error' | 'info';
  description: string;
  isSpecialPattern?: boolean;
}

export const DENTAL_COLORS = {
  healthy: {
    fill: '#FFFFFF',
    stroke: '#C9D6E6',
    border: '#C9D6E6',
  },
  caries: {
    fill: '#E23B3B',
    stroke: '#B91C1C',
    border: '#E23B3B',
  },
  filled: {
    fill: '#2563C9',
    stroke: '#1D4ED8',
    border: '#2563C9',
  },
  crown: {
    fill: '#F2B705',
    stroke: '#D97706',
    border: '#F2B705',
  },
  bridge: {
    fill: '#8B5CF6',
    stroke: '#6D28D9',
    border: '#8B5CF6',
  },
  implant: {
    fill: '#14B8A6',
    stroke: '#0F766E',
    border: '#14B8A6',
  },
  missing: {
    fill: '#CBD5E1',
    stroke: '#94A3B8',
    border: '#94A3B8',
  },
  root_canal: {
    fill: '#DC2626',
    stroke: '#991B1B',
    border: '#DC2626',
  },
  fractured: {
    fill: '#F97316',
    stroke: '#C2410C',
    border: '#F97316',
  },
  impacted: {
    fill: '#FB923C',
    stroke: '#EA580C',
    border: '#FB923C',
  },
  veneer: {
    fill: '#06B6D4',
    stroke: '#0891B2',
    border: '#06B6D4',
  },
  sealant: {
    fill: '#38BDF8',
    stroke: '#0284C7',
    border: '#38BDF8',
  },
  to_extract: {
    fill: '#EF4444',
    stroke: '#B91C1C',
    border: '#EF4444',
  },
} as const;

export const CONDITION_CONFIGS: Record<ToothCondition, ConditionColorConfig> = {
  healthy: {
    condition: 'healthy',
    label_ar: 'سليم',
    label_en: 'Healthy',
    fill: '#FFFFFF',
    stroke: '#C9D6E6',
    text_color: '#334155',
    bg_class: 'bg-white',
    border_class: 'border-slate-300',
    badge_variant: 'default',
    description: 'سن طبيعي سليم تماماً بدون آفات',
  },
  caries: {
    condition: 'caries',
    label_ar: 'تسوس نخر',
    label_en: 'Caries',
    fill: '#E23B3B',
    stroke: '#B91C1C',
    text_color: '#FFFFFF',
    bg_class: 'bg-rose-600',
    border_class: 'border-rose-700',
    badge_variant: 'error',
    description: 'نخر أو تسوس نشط بحاجة إلى حشوة',
  },
  filled: {
    condition: 'filled',
    label_ar: 'حشوة سابقة',
    label_en: 'Filled',
    fill: '#2563C9',
    stroke: '#1D4ED8',
    text_color: '#FFFFFF',
    bg_class: 'bg-blue-600',
    border_class: 'border-blue-700',
    badge_variant: 'info',
    description: 'ترميم أو حشوة كومبوزيت/أملغم سابقة',
  },
  crown: {
    condition: 'crown',
    label_ar: 'تاج / تلبيسة',
    label_en: 'Crown',
    fill: '#F2B705',
    stroke: '#D97706',
    text_color: '#FFFFFF',
    bg_class: 'bg-amber-500',
    border_class: 'border-amber-600',
    badge_variant: 'warning',
    description: 'تاج أو تلبيسة خزفية / معدنية',
  },
  bridge: {
    condition: 'bridge',
    label_ar: 'جسر سني',
    label_en: 'Bridge',
    fill: '#8B5CF6',
    stroke: '#6D28D9',
    text_color: '#FFFFFF',
    bg_class: 'bg-purple-600',
    border_class: 'border-purple-700',
    badge_variant: 'info',
    description: 'دعامة أو دمية جسر ثابت',
  },
  implant: {
    condition: 'implant',
    label_ar: 'زرعة سنية',
    label_en: 'Implant',
    fill: '#14B8A6',
    stroke: '#0F766E',
    text_color: '#FFFFFF',
    bg_class: 'bg-teal-500',
    border_class: 'border-teal-600',
    badge_variant: 'success',
    description: 'زرعة تيتانيوم مع تعويض سني',
  },
  missing: {
    condition: 'missing',
    label_ar: 'مفقود / مخلوع',
    label_en: 'Missing',
    fill: '#CBD5E1',
    stroke: '#94A3B8',
    text_color: '#64748B',
    bg_class: 'bg-slate-300',
    border_class: 'border-slate-400',
    badge_variant: 'default',
    description: 'سن مفقود خلقياً أو تم خلعه مسبقاً (✕)',
  },
  root_canal: {
    condition: 'root_canal',
    label_ar: 'علاج عصب (RCT)',
    label_en: 'Root Canal',
    fill: '#DC2626',
    stroke: '#991B1B',
    text_color: '#FFFFFF',
    bg_class: 'bg-red-600',
    border_class: 'border-red-700',
    badge_variant: 'error',
    description: 'معالجة لبية مكتملة (خط أحمر في الجذر)',
  },
  fractured: {
    condition: 'fractured',
    label_ar: 'كسر / شرخ',
    label_en: 'Fractured',
    fill: '#F97316',
    stroke: '#C2410C',
    text_color: '#FFFFFF',
    bg_class: 'bg-orange-500',
    border_class: 'border-orange-600',
    badge_variant: 'warning',
    description: 'كسر في التاج أو الجذر (خط متعرج)',
  },
  impacted: {
    condition: 'impacted',
    label_ar: 'منطمر عظمياً',
    label_en: 'Impacted',
    fill: '#FB923C',
    stroke: '#EA580C',
    text_color: '#FFFFFF',
    bg_class: 'bg-orange-400',
    border_class: 'border-orange-500',
    badge_variant: 'warning',
    description: 'سن منطمر أو مدفون داخل العظم',
  },
  veneer: {
    condition: 'veneer',
    label_ar: 'قشرة خزفية (فينير)',
    label_en: 'Veneer',
    fill: '#06B6D4',
    stroke: '#0891B2',
    text_color: '#FFFFFF',
    bg_class: 'bg-cyan-500',
    border_class: 'border-cyan-600',
    badge_variant: 'info',
    description: 'وجه تجميلي فينير على السطح الدهليزي',
  },
  sealant: {
    condition: 'sealant',
    label_ar: 'ساد شقوق ووهاد',
    label_en: 'Sealant',
    fill: '#38BDF8',
    stroke: '#0284C7',
    text_color: '#FFFFFF',
    bg_class: 'bg-sky-400',
    border_class: 'border-sky-500',
    badge_variant: 'info',
    description: 'مادة وقائية لسد شقوق المينا',
  },
  to_extract: {
    condition: 'to_extract',
    label_ar: 'مقرر خلعه',
    label_en: 'To Extract',
    fill: '#EF4444',
    stroke: '#B91C1C',
    text_color: '#FFFFFF',
    bg_class: 'bg-rose-500',
    border_class: 'border-rose-600',
    badge_variant: 'error',
    description: 'سن غير قابل للترميم مقرر خلعه جراحياً',
  },
};

/**
 * Returns fill, stroke and dash styling for a given condition and status.
 */
export function getConditionStyle(
  condition?: ToothCondition,
  status?: ToothRecordStatus
): {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  fillOpacity: number;
} {
  const isPlanned = status === 'planned';

  if (!condition || condition === 'healthy') {
    return {
      fill: DENTAL_COLORS.healthy.fill,
      stroke: isPlanned ? '#3B82F6' : DENTAL_COLORS.healthy.stroke,
      strokeWidth: isPlanned ? 1.5 : 1,
      strokeDasharray: isPlanned ? '3 2' : undefined,
      fillOpacity: 1,
    };
  }

  const base = DENTAL_COLORS[condition] || DENTAL_COLORS.healthy;

  return {
    fill: base.fill,
    stroke: base.stroke,
    strokeWidth: isPlanned ? 2 : 1,
    strokeDasharray: isPlanned ? '3 2' : undefined,
    fillOpacity: isPlanned ? 0.75 : 0.95,
  };
}

export function getConditionLabelAr(condition?: ToothCondition): string {
  if (!condition) return 'سليم';
  return CONDITION_CONFIGS[condition]?.label_ar || condition;
}
