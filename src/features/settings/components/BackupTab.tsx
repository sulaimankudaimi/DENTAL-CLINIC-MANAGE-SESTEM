import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  Lock,
  Clock,
  HardDrive,
  CheckCircle2,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import type { BackupSettings, BackupHistoryRecord } from '../types';

interface BackupTabProps {
  settings: BackupSettings;
  onSaveSettings: (updated: BackupSettings) => void;
}

// Simple Web Crypto AES-GCM helper for password-based encryption
async function encryptData(plainText: string, password?: string): Promise<string> {
  if (!password) {
    return btoa(unescape(encodeURIComponent(plainText)));
  }
  const enc = new TextEncoder();
  const pwUtf8 = enc.encode(password);
  const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);
  const key = await crypto.subtle.importKey(
    'raw',
    pwHash,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plainText)
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function decryptData(cipherBase64: string, password?: string): Promise<string> {
  if (!password) {
    return decodeURIComponent(escape(atob(cipherBase64)));
  }
  const binary = atob(cipherBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const iv = bytes.slice(0, 12);
  const encrypted = bytes.slice(12);

  const enc = new TextEncoder();
  const pwUtf8 = enc.encode(password);
  const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);
  const key = await crypto.subtle.importKey(
    'raw',
    pwHash,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

export const BackupTab: React.FC<BackupTabProps> = ({
  settings,
  onSaveSettings,
}) => {
  const { showToast } = useToast();
  const [config, setConfig] = useState<BackupSettings>(settings);

  // Manual Backup State
  const [manualPassword, setManualPassword] = useState('');
  const [useEncryption, setUseEncryption] = useState(true);
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);

  // Restore Modal State
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePassword, setRestorePassword] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  // Handle Manual Backup Download
  const handleCreateManualBackup = async () => {
    setIsGeneratingBackup(true);
    try {
      // Gather local storage records for complete clinic snapshot
      const snapshot: Record<string, unknown> = {
        clinic_backup_metadata: {
          app: 'Eyadati Dental OS',
          version: '2.4.0',
          created_at: new Date().toISOString(),
          type: 'manual',
          encrypted: useEncryption && !!manualPassword,
        },
      };

      // Collect storage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('_vite')) {
          try {
            snapshot[key] = JSON.parse(localStorage.getItem(key) || 'null');
          } catch {
            snapshot[key] = localStorage.getItem(key);
          }
        }
      }

      const rawJson = JSON.stringify(snapshot, null, 2);
      let payload = rawJson;
      const isEncrypted = useEncryption && !!manualPassword;

      if (isEncrypted) {
        payload = await encryptData(rawJson, manualPassword);
      }

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = `${now.getHours()}${now.getMinutes()}`;
      const filename = `eyadati_backup_${dateStr}_${timeStr}.${isEncrypted ? 'ebak' : 'json'}`;

      // Trigger download
      const blob = new Blob([payload], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Record in history
      const newRecord: BackupHistoryRecord = {
        id: `bak-${Date.now()}`,
        filename,
        created_at: now.toISOString(),
        size_kb: Math.round(blob.size / 1024) || 120,
        is_auto: false,
        is_encrypted: isEncrypted,
      };

      const updatedHistory = [newRecord, ...config.history.slice(0, config.retention_count - 1)];
      const updatedConfig = { ...config, last_backup_time: now.toISOString(), history: updatedHistory };
      setConfig(updatedConfig);
      onSaveSettings(updatedConfig);

      showToast({
        title: 'تم إنشاء النسخة الاحتياطية',
        description: `تم حفظ الملف بنجاح (${filename}) ${isEncrypted ? 'مع التشفير AES-256' : ''}`,
        variant: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'خطأ',
        description: 'فشل إنشاء النسخة الاحتياطية: ' + (err.message || 'خطأ غير معروف'),
        variant: 'error',
      });
    } finally {
      setIsGeneratingBackup(false);
    }
  };

  // Handle Restore
  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) {
      showToast({ title: 'تنبيه', description: 'يرجى اختيار ملف النسخة الاحتياطية', variant: 'error' });
      return;
    }

    if (confirmPhrase.trim() !== 'استعادة') {
      showToast({
        title: 'تأكيد الحماية مطلوب',
        description: 'يجب كتابة كلمة "استعادة" في حقل التأكيد للمتابعة',
        variant: 'warning',
      });
      return;
    }

    setIsRestoring(true);
    try {
      const fileText = await restoreFile.text();
      let jsonContent = fileText;

      // If file ends with .ebak or user provided password, decrypt
      if (restoreFile.name.endsWith('.ebak') || restorePassword) {
        try {
          jsonContent = await decryptData(fileText, restorePassword);
        } catch {
          throw new Error('فشل فك التشفير. تأكد من إدخال كلمة المرور الصحيحة التي شُفِّر بها الملف.');
        }
      }

      const parsed = JSON.parse(jsonContent);

      // Restore keys to localStorage
      Object.entries(parsed).forEach(([key, val]) => {
        if (key !== 'clinic_backup_metadata') {
          if (typeof val === 'string') {
            localStorage.setItem(key, val);
          } else {
            localStorage.setItem(key, JSON.stringify(val));
          }
        }
      });

      showToast({
        title: 'تمت الاستعادة بنجاح',
        description: 'تم استرجاع كافة سجلات المرضى والعيادة بنجاح. سيتم تحديث الصفحة الآن.',
        variant: 'success',
      });

      setIsRestoreModalOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      showToast({
        title: 'فشل الاستعادة',
        description: err.message || 'الملف تالف أو غير متوافق',
        variant: 'error',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSaveScheduleConfig = () => {
    onSaveSettings(config);
    showToast({
      title: 'تم الحفظ',
      description: 'تم تحديث سياسة النسخ الاحتياطي التلقائي ومسار الحفظ',
      variant: 'success',
    });
  };

  const handleDeleteHistory = (id: string) => {
    const updated = {
      ...config,
      history: config.history.filter((h) => h.id !== id),
    };
    setConfig(updated);
    onSaveSettings(updated);
    showToast({ title: 'تم الحذف', description: 'تم إزالة سجل النسخة من القائمة', variant: 'success' });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">النسخ الاحتياطي المشفر والاستعادة الآمنة</h2>
            <p className="text-xs text-text-secondary">
              حماية بيانات المرضى والتاريخ الطبي بكلمة مرور (AES-256) مع جدولة آلية واستعادة بتأكيد مزدوج
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRestoreModalOpen(true)}
            className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
          >
            <Upload className="w-4 h-4" />
            <span>استعادة من ملف...</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Manual Backup Card */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-border/60">
              <Download className="w-4 h-4 text-brand-navy" />
              <h3 className="text-xs font-bold text-text-primary">نسخ احتياطي فوري الآن (Manual Snapshot)</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              توليد ملف نسخة احتياطية كامل لجميع المرضى، المواعيد، الفواتير، والأشعة وحفظه على جهازك فوراً.
            </p>

            <div className="p-3.5 bg-surface-ground rounded-xl border border-surface-border space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={useEncryption}
                  onChange={(e) => setUseEncryption(e.target.checked)}
                  className="rounded text-brand-navy"
                />
                <span className="font-bold text-text-primary flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-brand-navy" />
                  تشفير النسخة بكلمة مرور قوية (AES-256)
                </span>
              </label>

              {useEncryption && (
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1">
                    كلمة مرور التشفير (مطلوبة عند الاستعادة):
                  </label>
                  <input
                    type="password"
                    value={manualPassword}
                    onChange={(e) => setManualPassword(e.target.value)}
                    placeholder="أدخل كلمة مرور قوية لتأمين الملف"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-surface-border bg-white"
                  />
                  <span className="text-[10px] text-amber-700 mt-1 block">
                    ⚠️ تذكير: لا يمكن استعادة الملف بدون هذه الكلمة السرية في المستقبل.
                  </span>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="primary"
            loading={isGeneratingBackup}
            onClick={handleCreateManualBackup}
            className="w-full justify-center gap-2 mt-4"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل نسخة احتياطية فورية الآن (.ebak)</span>
          </Button>
        </div>

        {/* 2. Automated Scheduled Backup Card */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border/60">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-text-primary">النسخ الاحتياطي التلقائي المجدول</h3>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.auto_backup_enabled}
                  onChange={(e) => setConfig({ ...config, auto_backup_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1">تكرار النسخ</label>
                  <select
                    value={config.frequency}
                    disabled={!config.auto_backup_enabled}
                    onChange={(e) => setConfig({ ...config, frequency: e.target.value as any })}
                    className="w-full h-9 px-2.5 rounded-lg border border-surface-border bg-surface-ground disabled:opacity-50"
                  >
                    <option value="daily">يومياً عند الإغلاق</option>
                    <option value="weekly">أسبوعياً (كل يوم جمعة)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1">وقت التنفيذ</label>
                  <input
                    type="time"
                    value={config.execution_time}
                    disabled={!config.auto_backup_enabled}
                    onChange={(e) => setConfig({ ...config, execution_time: e.target.value })}
                    className="w-full h-9 px-2.5 rounded-lg border border-surface-border bg-surface-ground disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1">
                  مسار المجلد المحلي أو ذاكرة USB:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={config.destination_path}
                    disabled={!config.auto_backup_enabled}
                    onChange={(e) => setConfig({ ...config, destination_path: e.target.value })}
                    className="flex-1 h-9 px-2.5 text-xs rounded-lg border border-surface-border bg-surface-ground font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1">
                  سياسة الاحتفاظ (Retention Policy):
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary">الاحتفاظ بآخر</span>
                  <input
                    type="number"
                    min={3}
                    max={60}
                    value={config.retention_count}
                    disabled={!config.auto_backup_enabled}
                    onChange={(e) => setConfig({ ...config, retention_count: parseInt(e.target.value) || 10 })}
                    className="w-16 h-8 text-center font-bold text-brand-navy rounded border border-surface-border bg-white"
                  />
                  <span className="text-text-secondary">نسخة احتياطية وحذف الأقدم تلقائياً.</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveScheduleConfig}
            className="w-full justify-center mt-3"
          >
            حفظ إعدادات الجدولة
          </Button>
        </div>
      </div>

      {/* 3. Backup History Table */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border/60">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-brand-navy" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">سجل النسخ الاحتياطية الأخيرة المحفوظة</h3>
              <p className="text-xs text-text-secondary">
                آخر {config.history.length} نسخ تم إنشاؤها بنجاح مع مؤشرات التشفير والحجم
              </p>
            </div>
          </div>

          {config.last_backup_time && (
            <span className="text-xs text-text-secondary flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              آخر نسخة: {new Date(config.last_backup_time).toLocaleDateString('ar-SA')}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-border text-text-secondary text-right">
                <th className="py-2.5 px-3 font-bold">اسم الملف</th>
                <th className="py-2.5 px-3 font-bold">تاريخ الإنشاء</th>
                <th className="py-2.5 px-3 font-bold">الحجم التقريبي</th>
                <th className="py-2.5 px-3 font-bold">النوع</th>
                <th className="py-2.5 px-3 font-bold">التشفير</th>
                <th className="py-2.5 px-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {config.history.map((record) => (
                <tr key={record.id} className="hover:bg-surface-ground">
                  <td className="py-3 px-3 font-mono font-bold text-text-primary flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-500" />
                    <span>{record.filename}</span>
                  </td>
                  <td className="py-3 px-3 text-text-secondary font-mono">
                    {new Date(record.created_at).toLocaleString('ar-SA')}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {(record.size_kb / 1024).toFixed(2)} ميجابايت
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant={record.is_auto ? 'info' : 'neutral'}>
                      {record.is_auto ? 'آلي مجدول' : 'يدوي فوري'}
                    </Badge>
                  </td>
                  <td className="py-3 px-3">
                    {record.is_encrypted ? (
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                        <Lock className="w-2.5 h-2.5" /> AES-256
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">غير مشفر</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleDeleteHistory(record.id)}
                      className="text-text-secondary hover:text-red-600 p-1"
                      title="حذف من السجل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Double Confirmation Restore Modal */}
      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title="استعادة البيانات من نسخة احتياطية (تأكيد مزدوج)"
      >
        <form onSubmit={handleRestoreSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-red-800">
              <ShieldAlert className="w-4 h-4" />
              <span>تحذير أمني شديد الأهمية:</span>
            </div>
            <p>
              استعادة نسخة احتياطية ستقوم بالكتابة فوق قاعدة البيانات الحالية واستبدال كافة السجلات بمحتوى الملف. يرجى أخذ نسخة احتياطية حالية قبل المتابعة.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              اختر ملف النسخة (.ebak أو .json) *
            </label>
            <input
              type="file"
              accept=".ebak,.json"
              onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
              className="w-full text-xs p-2 rounded-xl border border-surface-border bg-surface-ground"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              كلمة مرور فك التشفير (إذا كان الملف مشفراً)
            </label>
            <input
              type="password"
              value={restorePassword}
              onChange={(e) => setRestorePassword(e.target.value)}
              placeholder="أدخل كلمة المرور التي استخدمت أثناء النسخ"
              className="w-full text-xs px-3 py-2 rounded-xl border border-surface-border bg-surface-card"
            />
          </div>

          {/* Double Confirmation Gate */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
            <label className="block text-xs font-bold text-amber-900">
              التأكيد المزدوج: اكتب كلمة <span className="underline font-black">استعادة</span> أدناه لتأكيد الاسترجاع:
            </label>
            <input
              type="text"
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              placeholder="اكتب: استعادة"
              className="w-full text-xs px-3 py-2 rounded-lg border border-amber-300 bg-white font-bold text-red-700"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRestoreModalOpen(false)}
            >
              إلغاء التراجع
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={isRestoring}
              disabled={confirmPhrase.trim() !== 'استعادة' || !restoreFile}
            >
              بدء الاستعادة الشاملة
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
