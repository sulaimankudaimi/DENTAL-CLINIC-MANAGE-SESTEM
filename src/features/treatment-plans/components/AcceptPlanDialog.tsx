import React, { useState } from 'react';
import type { TreatmentPlan, TreatmentPlanItem, Procedure, Patient, User } from '@shared/contracts';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle,
  FileCheck2,
  AlertCircle,
  X,
} from 'lucide-react';

export interface AcceptPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ invoiceId: string; invoiceNumber: string; treatmentsCount: number } | null>;
  plan: TreatmentPlan;
  items: TreatmentPlanItem[];
  procedures?: Procedure[];
  patient?: Patient | null;
  dentist?: User | null;
}

export const AcceptPlanDialog: React.FC<AcceptPlanDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  plan,
  items,
  patient,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    invoiceId: string;
    invoiceNumber: string;
    treatmentsCount: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Financial totals down to the halala
  let subtotalHalalas = 0;
  let discountHalalas = 0;
  items.forEach((item) => {
    subtotalHalalas += (item.unit_price_halalas || 0) * (item.quantity || 1);
    discountHalalas += item.discount_halalas || 0;
  });
  const netTotalHalalas = Math.max(0, subtotalHalalas - discountHalalas);

  const handleExecute = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await onConfirm();
      if (res) {
        setResult(res);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'فشل تنفيذ معاملة قبول الخطة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                اعتماد وقبول الخطة العلاجية رسمياً
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                معاملة ذرية آمنة (Atomic Transaction) — إما الكل أو لا شيء
              </p>
            </div>
          </div>
          {!result && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-right">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {result ? (
            /* Success View */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  تم اعتماد الخطة العلاجية بنجاح تام!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  تم تنفيذ جميع العمليات في معاملة متكاملة ومطابقة للملخص المالي بالهللة
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5 text-right">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">رقم الفاتورة التقديرية الصادرة:</span>
                  <span className="font-mono font-bold text-brand-navy">
                    {result.invoiceNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">إجمالي قيمة الفاتورة:</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(netTotalHalalas)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">عدد الإجراءات العلاجية المجدولة:</span>
                  <span className="font-bold text-emerald-700">
                    {result.treatmentsCount} إجراء مجدول
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">مخطط الأسنان السريري:</span>
                  <span className="font-semibold text-blue-700">
                    تم تحديث الأسنان المستهدفة بحالة (مخطط)
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button variant="primary" size="md" onClick={onClose} className="w-full text-xs">
                  تم، العودة إلى ملف المريض
                </Button>
              </div>
            </div>
          ) : (
            /* Confirmation Prompt */
            <div className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">عنوان الخطة:</span>
                  <span className="font-bold text-slate-900">{plan.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">المريض:</span>
                  <span className="font-bold text-slate-900">
                    {[patient?.first_name, patient?.father_name, patient?.family_name].filter(Boolean).join(' ') || patient?.code}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">عدد الإجراءات المدرجة:</span>
                  <span className="font-bold text-[#1E4E9C]">{items.length} إجراء سريري</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-blue-200/60 font-bold">
                  <span className="text-slate-800">صافي قيمة الخطة (المطابق للفاتورة):</span>
                  <span className="text-[#1E4E9C] text-sm">{formatCurrency(netTotalHalalas)}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-3 bg-slate-50/50">
                <span className="font-bold text-slate-800 block">
                  الإجراءات الفورية التي سيتم تنفيذها آلياً في قاعدة البيانات:
                </span>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-brand-navy flex items-center justify-center shrink-0 mt-0.5 font-bold text-[11px]">
                      1
                    </div>
                    <span className="text-slate-600">
                      إنشاء سجلات علاجات مجدولة (Scheduled Treatments) في جدول treatments لكل بند في الخطة.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-brand-navy flex items-center justify-center shrink-0 mt-0.5 font-bold text-[11px]">
                      2
                    </div>
                    <span className="text-slate-600">
                      إصدار فاتورة تقديرية رسمية (Estimated Invoice) مطابقة للملخص المالي بدقة الهللة مع بنود مفصلة.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-brand-navy flex items-center justify-center shrink-0 mt-0.5 font-bold text-[11px]">
                      3
                    </div>
                    <span className="text-slate-600">
                      تحديث مخطط وسجلات أسنان المريض (Tooth Records) بحالة "مخطط للعلاج" وربطها برقم العلاج.
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                ملاحظة: تضمن المعاملة الذرية عدم حدوث أي تضارب أو فقدان للبيانات في حال تعذر أي من الخطوات الثلاث.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                  إلغاء
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle className="w-4 h-4" />}
                  onClick={handleExecute}
                  disabled={isSubmitting || items.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSubmitting ? 'جاري التنفيذ الذري...' : 'تأكيد الاعتماد وإصدار الفاتورة'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
