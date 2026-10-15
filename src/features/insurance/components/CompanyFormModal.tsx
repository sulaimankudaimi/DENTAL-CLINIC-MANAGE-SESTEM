import React, { useState, useEffect } from 'react';
import type { InsuranceCompany, CreateInsuranceCompany, UpdateInsuranceCompany } from '@shared/contracts';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Percent,
  Coins,
  X,
  Plus,
  Tag,
  AlertCircle,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { COMMON_EXCLUDED_PROCEDURES } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  companyToEdit?: InsuranceCompany | null;
}

export const CompanyFormModal: React.FC<Props> = ({ isOpen, onClose, companyToEdit }) => {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [coveragePercent, setCoveragePercent] = useState<number>(80);
  const [requiresPreapproval, setRequiresPreapproval] = useState<boolean>(true);
  const [annualLimitSar, setAnnualLimitSar] = useState<string>('5000');
  const [excludedProcedures, setExcludedProcedures] = useState<string[]>([]);
  const [newExcludedInput, setNewExcludedInput] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (companyToEdit) {
      setName(companyToEdit.name || '');
      setCoveragePercent(companyToEdit.coverage_percent_default ?? 80);
      setRequiresPreapproval(companyToEdit.requires_preapproval ?? true);
      setAnnualLimitSar(
        companyToEdit.annual_limit_halalas !== null && companyToEdit.annual_limit_halalas !== undefined
          ? String(companyToEdit.annual_limit_halalas / 100)
          : ''
      );
      setExcludedProcedures(companyToEdit.excluded_procedures || []);
      setContact(companyToEdit.contact || '');
      setPhone(companyToEdit.phone || '');
      setEmail(companyToEdit.email || '');
      setNotes(companyToEdit.notes || '');
    } else {
      setName('');
      setCoveragePercent(80);
      setRequiresPreapproval(true);
      setAnnualLimitSar('5000');
      setExcludedProcedures(['تبييض الأسنان بالليزر', 'تقويم الأسنان التجميلي']);
      setContact('');
      setPhone('');
      setEmail('');
      setNotes('');
    }
    setErrorMsg('');
  }, [companyToEdit, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const annualHalalas = annualLimitSar.trim() !== '' ? Math.round(parseFloat(annualLimitSar) * 100) : null;

      if (companyToEdit) {
        const payload: UpdateInsuranceCompany = {
          name: name.trim(),
          coverage_percent_default: coveragePercent,
          requires_preapproval: requiresPreapproval,
          annual_limit_halalas: annualHalalas,
          excluded_procedures: excludedProcedures,
          contact: contact.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          notes: notes.trim() || null,
        };
        const res = await api.insurance.updateCompany(companyToEdit.id, payload);
        if (!res.ok) throw new Error(res.error || 'فشل تحديث شركة التأمين');
        return res.data;
      } else {
        const payload: CreateInsuranceCompany = {
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          name: name.trim(),
          coverage_percent_default: coveragePercent,
          requires_preapproval: requiresPreapproval,
          annual_limit_halalas: annualHalalas,
          excluded_procedures: excludedProcedures,
          contact: contact.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          notes: notes.trim() || null,
        };
        const res = await api.insurance.createCompany(payload);
        if (!res.ok) throw new Error(res.error || 'فشل إضافة شركة التأمين');
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.insurance.companies });
      onClose();
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || 'حدث خطأ أثناء الحفظ');
    },
  });

  if (!isOpen) return null;

  const handleAddExcludedProcedure = (procName?: string) => {
    const item = (procName || newExcludedInput).trim();
    if (!item) return;
    if (!excludedProcedures.includes(item)) {
      setExcludedProcedures([...excludedProcedures, item]);
    }
    if (!procName) setNewExcludedInput('');
  };

  const handleRemoveExcludedProcedure = (procName: string) => {
    setExcludedProcedures(excludedProcedures.filter((p) => p !== procName));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم شركة التأمين');
      return;
    }
    if (coveragePercent < 0 || coveragePercent > 100) {
      setErrorMsg('نسبة التغطية يجب أن تكون بين 0 و 100%');
      return;
    }
    setErrorMsg('');
    saveMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {companyToEdit ? 'تعديل بيانات شركة التأمين' : 'إضافة شركة تأمين جديدة'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                إدارة نسب التغطية، الإجراءات المستثناة، والأسقف السنوية المعتمدة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[75vh] overflow-y-auto p-6 space-y-5">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Basic Info */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                اسم شركة التأمين <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: شركة بوبا العربية للتأمين التعاوني"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* Coverage & Preapproval Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  نسبة التغطية الافتراضية (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={coveragePercent}
                    onChange={(e) => setCoveragePercent(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400">
                    <Percent className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  سقف التغطية السنوي (ر.س)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="مثال: 5000"
                    value={annualLimitSar}
                    onChange={(e) => setAnnualLimitSar(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400">
                    <Coins className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  موافقة مسبقة
                </label>
                <div className="flex items-center h-10">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresPreapproval}
                      onChange={(e) => setRequiresPreapproval(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary dark:border-zinc-700"
                    />
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      تتطلب موافقة مسبقة
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Excluded Procedures */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  الإجراءات المستثناة من التغطية
                </label>
                <span className="text-[11px] text-zinc-400">
                  {excludedProcedures.length} إجراء مستثنى
                </span>
              </div>

              {/* Tag cloud */}
              <div className="flex flex-wrap gap-1.5 mb-3 min-h-[36px]">
                {excludedProcedures.length === 0 ? (
                  <span className="text-xs text-zinc-400 italic">لا توجد إجراءات مستثناة محددة</span>
                ) : (
                  excludedProcedures.map((proc: string) => (
                    <span
                      key={proc}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100/80 px-2.5 py-1 text-xs font-medium text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                    >
                      {proc}
                      <button
                        type="button"
                        onClick={() => handleRemoveExcludedProcedure(proc)}
                        className="rounded-full hover:bg-rose-200 p-0.5 text-rose-700 dark:hover:bg-rose-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add custom tag */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newExcludedInput}
                  onChange={(e) => setNewExcludedInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddExcludedProcedure();
                    }
                  }}
                  placeholder="أدخل اسم الإجراء المستثنى واضغط إضافة..."
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => handleAddExcludedProcedure()}
                  className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                >
                  <Plus className="h-3.5 w-3.5" />
                  إضافة
                </button>
              </div>

              {/* Common suggestions */}
              <div className="mt-3">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1.5">
                  مقترحات شائعة:
                </span>
                <div className="flex flex-wrap gap-1">
                  {COMMON_EXCLUDED_PROCEDURES.map((item) => {
                    const isAdded = excludedProcedures.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        disabled={isAdded}
                        onClick={() => handleAddExcludedProcedure(item)}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
                          isAdded
                            ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800'
                            : 'bg-white border border-zinc-300 text-zinc-700 hover:border-primary hover:text-primary dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        + {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  جهة الاتصال / المنسق
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="اسم المسؤول"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <User className="h-3.5 w-3.5 text-zinc-400 absolute left-2.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  هاتف التواصل
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="011xxxxxxx"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <Phone className="h-3.5 w-3.5 text-zinc-400 absolute left-2.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="claims@insurance.sa"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <Mail className="h-3.5 w-3.5 text-zinc-400 absolute left-2.5 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                ملاحظات وشروط خاصة
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي اشتراطات خاصة بالبوابة الإلكترونية أو متطلبات إرفاق الأشعة..."
                className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow hover:bg-primary/90 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'جاري الحفظ...' : companyToEdit ? 'حفظ التعديلات' : 'إضافة الشركة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
