import React, { useState } from 'react';
import type { User } from '@shared/contracts';
import { formatDateAr } from '@/lib/formatters';
import { Button } from '@/components/ui/Button';
import {
  Plus,
  User as UserIcon,
  MessageSquare,
} from 'lucide-react';

export interface ClinicalNoteItem {
  id: string;
  patient_id: string;
  dentist_name: string;
  created_at: string;
  category: 'examination' | 'procedure' | 'followup' | 'call';
  content: string;
}

export interface PatientNotesTabProps {
  patientId: string;
  dentists: User[];
}

export const PatientNotesTab: React.FC<PatientNotesTabProps> = ({
  patientId,
  dentists,
}) => {
  // Local state for clinical notes with realistic default history
  const [notes, setNotes] = useState<ClinicalNoteItem[]>([
    {
      id: '1',
      patient_id: patientId,
      dentist_name: dentists[0]?.full_name || 'سارة المنصور',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      category: 'examination',
      content:
        'فحص سريري شامل: وجود تسوس عميق في السن 16 ممتد إلى الجدار الإنسي، واللثة في حالة التهاب موضعي متوسط. تم طلب أشعة ذروية PA للسن 16 ومناقشة الخطة العلاجية مع المريض.',
    },
    {
      id: '2',
      patient_id: patientId,
      dentist_name: dentists[0]?.full_name || 'سارة المنصور',
      created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
      category: 'followup',
      content:
        'متابعة بعد إزالة الجير والتنظيف: تحسن ملحوظ في أنسجة اللثة وتوقف النزيف. تم إرشاد المريض حول تقنية التفريش الصحيحة واستخدام الخيط الطبي.',
    },
  ]);

  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'examination' | 'procedure' | 'followup' | 'call'>('followup');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const newNote: ClinicalNoteItem = {
      id: crypto.randomUUID(),
      patient_id: patientId,
      dentist_name: dentists[0]?.full_name || 'طبيب الأسنان',
      created_at: new Date().toISOString(),
      category: newCategory,
      content: newContent.trim(),
    };

    setNotes([newNote, ...notes]);
    setNewContent('');
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'examination':
        return 'كشف وتشخيص';
      case 'procedure':
        return 'جلسة علاجية';
      case 'followup':
        return 'متابعة سريرية';
      case 'call':
        return 'اتصال هاتفي';
      default:
        return 'ملاحظة عامة';
    }
  };

  return (
    <div id="patient-notes-tab" className="space-y-6">
      {/* Add note card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-navy" />
          إضافة ملاحظة سريرية جديدة
        </h3>

        <form onSubmit={handleAddNote} className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold text-slate-700">نوع الملاحظة:</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="text-xs rounded-lg border border-slate-300 py-1.5 px-3 bg-white text-slate-700 outline-none focus:border-brand-navy"
            >
              <option value="examination">كشف وتشخيص أولي</option>
              <option value="procedure">جلسة علاجية منجزة</option>
              <option value="followup">متابعة ما بعد العلاج</option>
              <option value="call">اتصال ومتابعة هاتفية</option>
            </select>
          </div>

          <textarea
            rows={3}
            required
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="اكتب التطورات السريرية، شكوى المريض، نتائج الفحص، أو توجيهات الجلسة القادمة..."
            className="w-full text-xs rounded-lg border border-slate-300 p-3 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none"
          />

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              type="submit"
              icon={<Plus className="w-4 h-4" />}
              className="text-xs"
            >
              حفظ الملاحظة السريرية
            </Button>
          </div>
        </form>
      </div>

      {/* Timeline Notes List */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-800">
          الملاحظات والتطورات السريرية السابقة ({notes.length})
        </h4>

        {notes.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            لا توجد ملاحظات سريرية مدونة
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-navy flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      د. {note.dentist_name}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[10px]">
                      {getCategoryLabel(note.category)}
                    </span>
                  </div>

                  <span className="text-slate-500 font-mono text-[11px]">
                    {formatDateAr(note.created_at)}
                  </span>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
