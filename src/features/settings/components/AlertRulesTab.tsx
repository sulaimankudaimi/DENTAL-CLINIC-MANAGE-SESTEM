import React, { useState } from 'react';
import {
  Bell,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { AlertRuleItem } from '../types';

interface AlertRulesTabProps {
  rules: AlertRuleItem[];
  onSaveRules: (rules: AlertRuleItem[]) => void;
  isSaving: boolean;
}

export const AlertRulesTab: React.FC<AlertRulesTabProps> = ({
  rules,
  onSaveRules,
  isSaving,
}) => {
  const { showToast } = useToast();
  const [localRules, setLocalRules] = useState<AlertRuleItem[]>(rules);

  const handleToggleRule = (ruleId: string) => {
    setLocalRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleValueChange = (ruleId: string, val: number) => {
    setLocalRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, value: Math.max(1, val) } : r))
    );
  };

  const handleToggleChannel = (ruleId: string, channel: 'system' | 'whatsapp' | 'sms') => {
    setLocalRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId) {
          const exists = r.channels.includes(channel);
          const newChannels = exists
            ? r.channels.filter((c) => c !== channel)
            : [...r.channels, channel];
          return { ...r, channels: newChannels.length ? newChannels : ['system'] };
        }
        return r;
      })
    );
  };

  const handleSave = () => {
    onSaveRules(localRules);
    showToast({
      title: 'تم الحفظ',
      description: 'تم تحديث قواعد التنبيهات والأتمتة الذكية بنجاح',
      variant: 'success',
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">التنبيهات السريرية والقواعد المؤتمتة</h2>
            <p className="text-xs text-text-secondary">
              قواعد ذكية قابلة للتفعيل للمتابعات الجراحية، تذكير المواعيد، استدعاء الفحص الدوري، والمخزون
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          loading={isSaving}
          onClick={handleSave}
          className="gap-2 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>حفظ وتطبيق القواعد</span>
        </Button>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {localRules.map((rule) => {
          return (
            <div
              key={rule.id}
              className={`p-5 rounded-2xl border transition-all ${
                rule.enabled
                  ? 'bg-surface-card border-surface-border shadow-xs'
                  : 'bg-surface-ground border-surface-border/50 opacity-75'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Switch + Details */}
                <div className="flex items-start gap-3.5 flex-1">
                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-xs font-bold ${rule.enabled ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {rule.name}
                      </h3>
                      {rule.enabled ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          مفعلة وتعمل
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-200 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                          معطلة
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      {rule.description}
                    </p>
                  </div>
                </div>

                {/* Right: Value input & Channels */}
                <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-surface-border/50">
                  {/* Parameter Input */}
                  <div className="flex items-center gap-1.5 bg-surface-ground p-1.5 px-2.5 rounded-xl border border-surface-border text-xs">
                    <span className="text-text-secondary font-medium">المهلة:</span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={rule.value}
                      disabled={!rule.enabled}
                      onChange={(e) => handleValueChange(rule.id, parseInt(e.target.value) || 1)}
                      className="w-14 text-center font-bold font-mono text-brand-navy bg-white border border-surface-border rounded-lg py-1 disabled:opacity-50"
                    />
                    <span className="font-bold text-text-primary">
                      {rule.unit === 'hours' ? 'ساعة' : rule.unit === 'days' ? 'يوم' : 'أشهر'}
                    </span>
                  </div>

                  {/* Channel Toggles */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={!rule.enabled}
                      onClick={() => handleToggleChannel(rule.id, 'system')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-colors ${
                        rule.channels.includes('system')
                          ? 'bg-blue-50 border-blue-300 text-blue-800'
                          : 'bg-white border-surface-border text-text-secondary opacity-60'
                      }`}
                    >
                      إشعار نظام
                    </button>
                    <button
                      type="button"
                      disabled={!rule.enabled}
                      onClick={() => handleToggleChannel(rule.id, 'whatsapp')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-colors ${
                        rule.channels.includes('whatsapp')
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-white border-surface-border text-text-secondary opacity-60'
                      }`}
                    >
                      واتساب
                    </button>
                    <button
                      type="button"
                      disabled={!rule.enabled}
                      onClick={() => handleToggleChannel(rule.id, 'sms')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-colors ${
                        rule.channels.includes('sms')
                          ? 'bg-purple-50 border-purple-300 text-purple-800'
                          : 'bg-white border-surface-border text-text-secondary opacity-60'
                      }`}
                    >
                      SMS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
