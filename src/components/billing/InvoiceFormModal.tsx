import React, { useState } from 'react';
import type { CreateInvoice, Procedure } from '@shared/contracts';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Trash2, AlertCircle, Receipt } from 'lucide-react';

export interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInvoice) => Promise<void>;
  defaultPatientId?: string;
  isLoading?: boolean;
}

interface InvoiceLineItem {
  id: string;
  procedure_id?: string;
  description: string;
  tooth_number?: number;
  quantity: number;
  unit_price_halalas: number;
  discount_halalas: number;
}

export const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultPatientId,
  isLoading = false,
}) => {
  const [patientId, setPatientId] = useState(defaultPatientId || '');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<InvoiceLineItem[]>([
    {
      id: '1',
      description: 'كشف واستشارة طبية عامة',
      quantity: 1,
      unit_price_halalas: 15000, // 150 SAR
      discount_halalas: 0,
    },
  ]);
  const [overallDiscountHalalas, setOverallDiscountHalalas] = useState(0);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Patients
  const { data: patients = [] } = useQuery({
    queryKey: queryKeys.patients.all,
    queryFn: async () => {
      const res = await api.patients.list({ page: 1, limit: 100, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
    enabled: isOpen,
  });

  // Procedures
  const { data: procedures = [] } = useQuery<Procedure[]>({
    queryKey: queryKeys.treatments.procedures(),
    queryFn: async () => {
      const res = await api.treatments.getProcedures({ page: 1, limit: 100, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
    enabled: isOpen,
  });

  const handleSelectProcedure = (itemId: string, procId: string) => {
    const proc = procedures.find((p) => p.id === procId);
    if (!proc) return;

    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              procedure_id: proc.id,
              description: proc.name_ar,
              unit_price_halalas: proc.default_price_halalas,
            }
          : i
      )
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        description: '',
        quantity: 1,
        unit_price_halalas: 0,
        discount_halalas: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Calculations
  const subtotalHalalas = items.reduce(
    (sum, i) => sum + i.unit_price_halalas * i.quantity,
    0
  );
  const itemsDiscountHalalas = items.reduce(
    (sum, i) => sum + i.discount_halalas * i.quantity,
    0
  );
  const totalDiscountHalalas = itemsDiscountHalalas + overallDiscountHalalas;
  const taxableAmountHalalas = Math.max(0, subtotalHalalas - totalDiscountHalalas);
  const vatHalalas = Math.round(taxableAmountHalalas * 0.15);
  const grandTotalHalalas = taxableAmountHalalas + vatHalalas;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setErrorMsg('يرجى اختيار المريض');
      return;
    }
    if (items.some((i) => !i.description.trim())) {
      setErrorMsg('يرجى كتابة وصف لجميع البنود');
      return;
    }

    try {
      const payload: CreateInvoice = {
        clinic_id: 'c1000000-0000-0000-0000-000000000001',
        branch_id: 'b1000000-0000-0000-0000-000000000001',
        patient_id: patientId,
        issue_date: new Date(issueDate).toISOString(),
        due_date: null,
        subtotal_halalas: subtotalHalalas,
        discount_halalas: totalDiscountHalalas,
        vat_percent: 15,
        vat_halalas: vatHalalas,
        total_halalas: grandTotalHalalas,
        paid_halalas: 0,
        balance_halalas: grandTotalHalalas,
        status: grandTotalHalalas === 0 ? 'paid' : 'unpaid',
        insurance_claim_id: null,
        zatca_qr: null,
        notes: notes.trim() || null,
        items: items.map((i) => {
          const lineSubtotal = i.unit_price_halalas * i.quantity;
          const lineDiscount = i.discount_halalas * i.quantity;
          const lineTotal = Math.max(0, lineSubtotal - lineDiscount);
          return {
            clinic_id: 'c1000000-0000-0000-0000-000000000001',
            treatment_id: null,
            description: i.description,
            tooth_number: i.tooth_number ?? null,
            quantity: i.quantity,
            unit_price_halalas: i.unit_price_halalas,
            discount_halalas: lineDiscount,
            total_halalas: lineTotal,
          };
        }),
      };

      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الفاتورة');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إصدار فاتورة ضريبية جديدة"
      description="إنشاء فاتورة علاجية مطابقة لمتطلبات هيئة الزكاة والضريبة والجمارك (ZATCA)"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="المريض *"
            value={patientId}
            onValueChange={(val) => setPatientId(val)}
            options={patients.map((p) => ({
              label: `${p.first_name} ${p.family_name} (${p.code})`,
              value: p.id,
            }))}
            required
          />

          <Input
            label="تاريخ الفاتورة *"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            required
          />
        </div>

        {/* Invoice items builder */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">بنود الفاتورة والإجراءات العلاجية</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
            >
              <Plus className="w-3.5 h-3.5 me-1 inline" />
              إضافة بند جديد
            </Button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 w-48">إجراء سريع</th>
                  <th className="p-2.5">الوصف / الإجراء الطبي</th>
                  <th className="p-2.5 w-20 text-center">السن</th>
                  <th className="p-2.5 w-20 text-center">الكمية</th>
                  <th className="p-2.5 w-28 text-center">السعر (ر.س)</th>
                  <th className="p-2.5 w-28 text-center">خصم البند</th>
                  <th className="p-2.5 w-28 text-left pl-3">الإجمالي</th>
                  <th className="p-2.5 w-10 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const lineTotal = item.unit_price_halalas * item.quantity - item.discount_halalas * item.quantity;
                  return (
                    <tr key={item.id}>
                      <td className="p-2">
                        <Select
                          placeholder="اختر إجراء..."
                          value={item.procedure_id || ''}
                          onValueChange={(val) => handleSelectProcedure(item.id, val)}
                          options={procedures.map((p) => ({
                            label: p.name_ar,
                            value: p.id,
                          }))}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className="w-full text-xs p-1.5 border border-slate-200 rounded"
                          placeholder="وصف الإجراء الطبي..."
                          value={item.description}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((x) => (x.id === item.id ? { ...x, description: e.target.value } : x))
                            )
                          }
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="11"
                          max="85"
                          placeholder="—"
                          className="w-full text-xs p-1.5 border border-slate-200 rounded text-center font-mono"
                          value={item.tooth_number || ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                            setItems((prev) =>
                              prev.map((x) => (x.id === item.id ? { ...x, tooth_number: val } : x))
                            );
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          className="w-full text-xs p-1.5 border border-slate-200 rounded text-center font-mono"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                            setItems((prev) =>
                              prev.map((x) => (x.id === item.id ? { ...x, quantity: val } : x))
                            );
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="1"
                          className="w-full text-xs p-1.5 border border-slate-200 rounded text-center font-mono"
                          value={item.unit_price_halalas / 100}
                          onChange={(e) => {
                            const val = Math.round(Number(e.target.value) * 100);
                            setItems((prev) =>
                              prev.map((x) => (x.id === item.id ? { ...x, unit_price_halalas: val } : x))
                            );
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.5"
                          className="w-full text-xs p-1.5 border border-slate-200 rounded text-center"
                          value={item.discount_halalas / 100}
                          onChange={(e) => {
                            const val = Math.round(Number(e.target.value) * 100);
                            setItems((prev) =>
                              prev.map((x) => (x.id === item.id ? { ...x, discount_halalas: val } : x))
                            );
                          }}
                        />
                      </td>
                      <td className="p-2 text-left font-bold text-slate-800 pl-3">
                        {formatCurrency(Math.max(0, Math.round(lineTotal)))}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary and Calculations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
          <Textarea
            label="ملاحظات وشروط الفاتورة"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: تشمل الفاتورة ضمان الحشوة لمدة سنة..."
            rows={3}
          />

          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>المجموع قبل الضريبة:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(subtotalHalalas)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>خصم إضافي عام (ر.س):</span>
              <input
                type="number"
                step="1"
                className="w-24 text-xs p-1 border border-slate-300 rounded text-center"
                value={overallDiscountHalalas / 100}
                onChange={(e) => setOverallDiscountHalalas(Math.round(Number(e.target.value) * 100))}
              />
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ضريبة القيمة المضافة (15%):</span>
              <span className="font-semibold text-slate-800">{formatCurrency(vatHalalas)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-brand-navy">
              <span>الإجمالي النهائي المستحق:</span>
              <span>{formatCurrency(grandTotalHalalas)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            <Receipt className="w-4 h-4 me-1 inline" />
            {isLoading ? 'جاري الإصدار...' : 'إصدار الفاتورة'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InvoiceFormModal;
