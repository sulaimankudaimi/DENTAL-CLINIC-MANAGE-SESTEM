import React, { useState } from 'react';
import {
  CalendarClock,
  Folder,
  Clock,
  CheckCircle2,
  HardDrive,
  FolderCheck,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { ReportDefinition } from '../types/reportsHub';
import type { ScheduleFrequency, ScheduledReportFormat, CreateScheduledReport } from '@shared/contracts';

interface ScheduleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportDefinition;
  onSaveSchedule: (data: CreateScheduledReport) => Promise<void>;
}

const DEFAULT_FOLDERS: Record<string, string> = {
  patients: 'C:/Eyadati/Reports/Patients',
  appointments: 'C:/Eyadati/Reports/Appointments',
  clinical: 'C:/Eyadati/Reports/Clinical',
  financial: 'C:/Eyadati/Reports/Financial',
};

export const ScheduleReportModal: React.FC<ScheduleReportModalProps> = ({
  isOpen,
  onClose,
  report,
  onSaveSchedule,
}) => {
  const [frequency, setFrequency] = useState<ScheduleFrequency>('weekly');
  const [timeOfDay, setTimeOfDay] = useState('08:00');
  const [targetFolder, setTargetFolder] = useState(
    DEFAULT_FOLDERS[report.category] || 'C:/Eyadati/Reports'
  );
  const [format, setFormat] = useState<ScheduledReportFormat>('pdf');
  const [enabled, setEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      await onSaveSchedule({
        reportId: report.id,
        reportName: report.title,
        category: report.category,
        frequency,
        timeOfDay,
        targetFolder,
        format,
        enabled,
      });
      setSuccessMessage('تمت جدولة التقرير وحفظ المسار بنجاح! سيتم توليد وحفظ ملف PDF تلقائياً في المجلد.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="جدولة التقرير الدوري وحفظ PDF تلقائياً"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Info Banner */}
        <div className="p-3.5 bg-brand-blue/5 border border-brand-blue/20 rounded-xl flex items-start gap-2.5">
          <CalendarClock className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-brand-navy">التقرير المحدد:</h4>
            <p className="text-text-primary font-semibold mt-0.5">{report.title}</p>
            <p className="text-[11px] text-text-muted mt-1">
              سيقوم النظام المكتبي بتوليد هذا التقرير تلقائياً وتصديره كملف PDF وحفظه في المجلد المحلي المخصص.
            </p>
          </div>
        </div>

        {/* 1. Frequency (تكرار الجدولة) */}
        <div>
          <label className="block text-text-primary font-bold mb-1.5">تكرار التوليد الدوري *</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'daily', label: 'يومي (Daily)', desc: 'كل صباح عند فتح العيادة' },
              { id: 'weekly', label: 'أسبوعي (Weekly)', desc: 'نهاية كل أسبوع عمل' },
              { id: 'monthly', label: 'شهري (Monthly)', desc: 'اليوم الأول من كل شهر' },
            ].map((freq) => (
              <button
                key={freq.id}
                type="button"
                onClick={() => setFrequency(freq.id as ScheduleFrequency)}
                className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                  frequency === freq.id
                    ? 'border-brand-blue bg-brand-blue/5 text-brand-navy font-bold'
                    : 'border-border bg-white text-text-secondary hover:bg-slate-50'
                }`}
              >
                <span className="text-xs">{freq.label}</span>
                <span className="text-[10px] text-text-muted mt-1 font-normal">{freq.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Time of Day (وقت التشغيل) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-text-primary font-bold mb-1">وقت التوليد والحفظ *</label>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 text-text-muted absolute start-2.5 top-2.5" />
              <input
                type="time"
                required
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-white ps-8 pe-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-text-primary font-bold mb-1">تنسيق الملف المحفوظ *</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as ScheduledReportFormat)}
              className="w-full h-9 rounded-xl border border-border bg-white px-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            >
              <option value="pdf">مستند رسمي PDF جاهز للطباعة</option>
              <option value="csv">جدول بيانات Excel (CSV)</option>
            </select>
          </div>
        </div>

        {/* 3. Target Folder Path (مسار مجلد الحفظ) */}
        <div>
          <label className="block text-text-primary font-bold mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Folder className="w-3.5 h-3.5 text-brand-teal" />
              <span>مجلد الحفظ التلقائي في الجهاز *</span>
            </span>
            <span className="text-[10px] text-text-muted font-normal">مسار محلي</span>
          </label>
          <div className="relative">
            <HardDrive className="w-3.5 h-3.5 text-text-muted absolute start-2.5 top-2.5" />
            <input
              type="text"
              required
              value={targetFolder}
              onChange={(e) => setTargetFolder(e.target.value)}
              placeholder="C:/Eyadati/Reports/Financial"
              dir="ltr"
              className="w-full h-9 rounded-xl border border-border bg-white ps-8 pe-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20 font-mono"
            />
          </div>

          {/* Quick preset folder shortcuts */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[10px] text-text-muted">مجلدات مقترحة:</span>
            {Object.entries(DEFAULT_FOLDERS).map(([key, folder]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTargetFolder(folder)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                {folder.split('/').pop()}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Enable / Active Toggle */}
        <div className="p-3 bg-slate-50 rounded-xl border border-border flex items-center justify-between">
          <div>
            <span className="font-bold text-text-primary block text-xs">تفعيل الجدولة التلقائية</span>
            <span className="text-[11px] text-text-muted">تشغيل الحفظ الدوري في الموعد المحدد بدون تدخل يدوي</span>
          </div>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 text-brand-blue rounded border-border focus:ring-brand-blue"
          />
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting} className="gap-1.5 font-bold">
            <FolderCheck className="w-4 h-4" />
            <span>حفظ الجدولة واعتماد المسار</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
