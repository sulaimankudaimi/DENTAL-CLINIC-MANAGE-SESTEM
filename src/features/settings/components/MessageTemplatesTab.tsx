import React, { useState } from 'react';
import {
  MessageSquare,
  Save,
  Send,
  Smartphone,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import type { MessageTemplateItem } from '../types';

interface MessageTemplatesTabProps {
  templates: MessageTemplateItem[];
  onSaveTemplates: (templates: MessageTemplateItem[]) => void;
  isSaving: boolean;
}

const SAMPLE_DATA: Record<string, string> = {
  '{{patient_name}}': 'أ. عبد الرحمن السعيد',
  '{{doctor_name}}': 'د. طارق المنصور',
  '{{clinic_name}}': 'عيادة ابتسامة النخبة',
  '{{clinic_phone}}': '0114567890',
  '{{clinic_address}}': 'طريق التخصصي، الرياض',
  '{{appointment_date}}': 'غداً الأربعاء 30 سبتمبر',
  '{{appointment_time}}': '05:30 مساءً',
  '{{room_name}}': 'عيادة التركيبات (102)',
  '{{procedure_name}}': 'علاج العصب والخلع البسيط',
  '{{invoice_number}}': 'INV-2026-0891',
  '{{invoice_amount}}': '750.00',
  '{{invoice_link}}': 'https://eyadati.sa/i/891',
};

export const MessageTemplatesTab: React.FC<MessageTemplatesTabProps> = ({
  templates,
  onSaveTemplates,
  isSaving,
}) => {
  const { showToast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || 'tmpl-1');
  const [localTemplates, setLocalTemplates] = useState<MessageTemplateItem[]>(templates);

  const currentTemplate = localTemplates.find((t) => t.id === selectedTemplateId) || localTemplates[0];

  const handleContentChange = (newContent: string) => {
    setLocalTemplates((prev) =>
      prev.map((t) => (t.id === selectedTemplateId ? { ...t, content: newContent } : t))
    );
  };

  const handleChannelChange = (newChannel: 'whatsapp' | 'sms') => {
    setLocalTemplates((prev) =>
      prev.map((t) => (t.id === selectedTemplateId ? { ...t, channel: newChannel } : t))
    );
  };

  const insertVariable = (variable: string) => {
    if (!currentTemplate) return;
    const textarea = document.getElementById('template-textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = currentTemplate.content;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const updated = before + variable + after;
      handleContentChange(updated);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 50);
    } else {
      handleContentChange(currentTemplate.content + ' ' + variable);
    }
  };

  const handleSaveAll = () => {
    onSaveTemplates(localTemplates);
    showToast({
      title: 'تم الحفظ',
      description: 'تم حفظ وتحديث قوالب الرسائل الآلية بنجاح',
      variant: 'success',
    });
  };

  // Generate live preview text with sample values replaced
  const generatePreviewText = (rawContent: string) => {
    let result = rawContent;
    Object.entries(SAMPLE_DATA).forEach(([variable, value]) => {
      result = result.replaceAll(variable, value);
    });
    return result;
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">قوالب الرسائل والإشعارات مع المعاينة الحية</h2>
            <p className="text-xs text-text-secondary">
              تخصيص نصوص رسائل تذكير المواعيد، التأكيد، المتابعات، وأعياد الميلاد عبر الواتساب وSMS
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          loading={isSaving}
          onClick={handleSaveAll}
          className="gap-2 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>حفظ كافة القوالب</span>
        </Button>
      </div>

      {/* Templates Selector Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {localTemplates.map((tmpl) => {
          const isSelected = tmpl.id === selectedTemplateId;
          return (
            <button
              key={tmpl.id}
              onClick={() => setSelectedTemplateId(tmpl.id)}
              className={`px-4 py-3 rounded-xl border text-right transition-all flex items-center gap-2.5 shrink-0 ${
                isSelected
                  ? 'border-brand-navy bg-brand-navy/5 text-brand-navy font-bold shadow-xs ring-1 ring-brand-navy/20'
                  : 'border-surface-border bg-surface-card text-text-secondary hover:text-text-primary'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  tmpl.channel === 'whatsapp' ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
              />
              <span className="text-xs">{tmpl.title}</span>
            </button>
          );
        })}
      </div>

      {/* Editor & Live Preview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Form (7 cols) */}
        <div className="lg:col-span-7 bg-surface-card rounded-2xl border border-surface-border p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border/60">
            <div>
              <h3 className="text-sm font-bold text-text-primary">{currentTemplate.title}</h3>
              <p className="text-xs text-text-secondary">{currentTemplate.description}</p>
            </div>

            {/* Channel Switcher */}
            <div className="flex items-center gap-1 bg-surface-ground p-1 rounded-xl border border-surface-border">
              <button
                type="button"
                onClick={() => handleChannelChange('whatsapp')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                  currentTemplate.channel === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span>واتساب</span>
              </button>
              <button
                type="button"
                onClick={() => handleChannelChange('sms')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                  currentTemplate.channel === 'sms'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span>SMS</span>
              </button>
            </div>
          </div>

          {/* Insertable Variables Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                المتغيرات الديناميكية (انقر للإدراج في مكان المؤشر):
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-surface-ground border border-surface-border">
              {currentTemplate.available_variables.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => insertVariable(variable)}
                  className="px-2 py-1 bg-white hover:bg-brand-navy hover:text-white text-brand-navy border border-brand-navy/30 rounded-lg text-xs font-mono transition-colors shadow-2xs font-semibold"
                  title={`إدراج ${variable}`}
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>

          {/* Content Textarea */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-primary">نص الرسالة *</label>
            <textarea
              id="template-textarea"
              rows={8}
              value={currentTemplate.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full p-3.5 text-xs rounded-xl border border-surface-border bg-surface-ground text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-navy/20 leading-relaxed font-sans"
              placeholder="اكتب نص القالب هنا..."
            />
            <div className="flex items-center justify-between text-[11px] text-text-secondary">
              <span>طول الرسالة: {currentTemplate.content.length} حرف</span>
              <span>
                {currentTemplate.channel === 'sms'
                  ? `(حوالي ${Math.ceil(currentTemplate.content.length / 70)} رسائل SMS)`
                  : 'رسالة واتساب غير محدودة'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Mockup Phone Preview (5 cols) */}
        <div className="lg:col-span-5 bg-surface-card rounded-2xl border border-surface-border p-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              المعاينة الحية على جوال المريض
            </span>
            <Badge variant={currentTemplate.channel === 'whatsapp' ? 'ok' : 'info'}>
              {currentTemplate.channel === 'whatsapp' ? 'WhatsApp Business' : 'SMS Message'}
            </Badge>
          </div>

          {/* Smartphone Frame */}
          <div className="w-full max-w-[320px] rounded-[36px] border-[6px] border-slate-800 bg-[#ECE5DD] shadow-xl overflow-hidden flex flex-col h-[460px] relative">
            {/* Phone Speaker Notch */}
            <div className="bg-slate-800 h-5 w-full flex justify-center items-center">
              <div className="w-16 h-2.5 bg-slate-900 rounded-full" />
            </div>

            {/* App Header */}
            {currentTemplate.channel === 'whatsapp' ? (
              <div className="bg-[#075E54] text-white p-3 flex items-center gap-2.5 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  عيادتي
                </div>
                <div className="leading-tight flex-1">
                  <span className="text-xs font-bold block">عيادة ابتسامة النخبة</span>
                  <span className="text-[10px] text-emerald-200">حساب أعمال موثق ✓</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 text-slate-800 p-2.5 border-b text-center text-xs font-bold">
                EYADATI-SMS
              </div>
            )}

            {/* Chat Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 flex flex-col justify-end">
              <div className="bg-white/80 backdrop-blur-xs text-[10px] text-slate-600 rounded-md px-2 py-0.5 self-center shadow-2xs">
                اليوم
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[90%] p-3 rounded-2xl shadow-xs text-xs leading-relaxed whitespace-pre-wrap ${
                  currentTemplate.channel === 'whatsapp'
                    ? 'bg-[#DCF8C6] text-slate-900 rounded-tr-xs self-start'
                    : 'bg-white text-slate-900 rounded-tr-xs self-start'
                }`}
              >
                {generatePreviewText(currentTemplate.content)}

                <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-500">
                  <span>10:45 ص</span>
                  {currentTemplate.channel === 'whatsapp' && (
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Input Bar Mock */}
            <div className="bg-slate-100 p-2 border-t flex items-center gap-2 text-slate-400">
              <div className="flex-1 bg-white h-7 rounded-full px-3 text-[10px] flex items-center text-slate-400">
                اكتب رسالة...
              </div>
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Send className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-text-secondary text-center mt-3">
            المتغيرات مثل <span className="font-mono text-brand-navy">{'{{patient_name}}'}</span> يتم استبدالها تلقائياً ببيانات المريض الفعلية عند الإرسال.
          </p>
        </div>
      </div>
    </div>
  );
};
