import { DEFAULT_MESSAGE_TEMPLATES } from '@/features/settings/defaultSettings';
import type { MessageTemplateItem } from '@/features/settings/types';

/**
 * يسترجع قوالب الرسائل المحفوظة في العيادة أو القوالب الافتراضية
 */
export function getStoredMessageTemplates(): MessageTemplateItem[] {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('clinic_message_templates') : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_MESSAGE_TEMPLATES;
}

/**
 * يولّد نص الرسالة باستبدال المتغيرات القياسية في القالب المحدد:
 * {{patient_name}}, {{date}}, {{time}}, {{clinic}}, {{clinic_name}},
 * {{doctor_name}}, {{invoice_number}}, {{invoice_amount}}, إلخ.
 */
export function renderMessageTemplate(
  templateType: string,
  variables: Record<string, string | number | undefined | null>,
  defaultFallback?: string
): string {
  const templates = getStoredMessageTemplates();
  const template = templates.find((t) => t.type === templateType);

  let content = template?.content || defaultFallback || '';
  if (!content) return '';

  // خريطة المرادفات لدعم {{date}} مع {{appointment_date}} و {{clinic}} مع {{clinic_name}}
  const mergedVars: Record<string, string> = {};
  for (const [k, v] of Object.entries(variables)) {
    const strVal = v != null ? String(v) : '';
    mergedVars[k] = strVal;
    if (k === 'date') mergedVars['appointment_date'] = strVal;
    if (k === 'appointment_date') mergedVars['date'] = strVal;
    if (k === 'time') mergedVars['appointment_time'] = strVal;
    if (k === 'appointment_time') mergedVars['time'] = strVal;
    if (k === 'clinic') mergedVars['clinic_name'] = strVal;
    if (k === 'clinic_name') mergedVars['clinic'] = strVal;
    if (k === 'phone') mergedVars['clinic_phone'] = strVal;
    if (k === 'doctor') mergedVars['doctor_name'] = strVal;
    if (k === 'amount') mergedVars['invoice_amount'] = strVal;
  }

  // استبدال المتغيرات بالصيغتين: {{variable}} و {variable}
  for (const [key, value] of Object.entries(mergedVars)) {
    const doubleRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    content = content.replace(doubleRegex, value);
    const singleRegex = new RegExp(`\\{${key}\\}`, 'gi');
    content = content.replace(singleRegex, value);
  }

  return content;
}
