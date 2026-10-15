import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  InsuranceClaim,
  Patient,
  Invoice,
  InsuranceCompany,
  CreateInsuranceClaim,
  InsuranceClaimAttachment,
} from '@shared/contracts';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import {
  FileText,
  X,
  AlertCircle,
  Paperclip,
  Check,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialCompanyId?: string;
  onClaimCreated?: (claim: InsuranceClaim) => void;
}

export const ClaimFormDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  initialCompanyId,
  onClaimCreated,
}) => {
  const queryClient = useQueryClient();

  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(initialCompanyId || '');
  const [claimNumber, setClaimNumber] = useState<string>('');
  const [claimedSar, setClaimedSar] = useState<string>('');
  const [attachments, setAttachments] = useState<InsuranceClaimAttachment[]>([
    { type: 'xray', file_name: 'أشعة بانورامية رقمية.dcm', file_path: '/uploads/xrays/panoramic_01.dcm' },
    { type: 'report', file_name: 'تقرير تشخيص الطبيب المعالج.pdf', file_path: '/uploads/reports/diagnosis_01.pdf' },
  ]);
  const [newAttachmentText, setNewAttachmentText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Fetch all patients
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: queryKeys.patients.all,
    queryFn: async () => {
      const res = await api.patients.list({});
      return res.ok ? res.data.items : [];
    },
    enabled: isOpen,
  });

  // Fetch companies
  const { data: companies = [] } = useQuery<InsuranceCompany[]>({
    queryKey: queryKeys.insurance.companies,
    queryFn: async () => {
      const res = await api.insurance.getCompanies();
      return res.ok ? res.data : [];
    },
    enabled: isOpen,
  });

  // Selected patient object
  const selectedPatient = useMemo(
    () => patients.find((p: Patient) => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  // Auto-set company when patient is selected
  useEffect(() => {
    if (selectedPatient && selectedPatient.insurance_company_id) {
      setSelectedCompanyId(selectedPatient.insurance_company_id);
    }
  }, [selectedPatient]);

  // Generate random claim number when opening
  useEffect(() => {
    if (isOpen) {
      const yr = new Date().getFullYear();
      const rand = Math.floor(100 + Math.random() * 900);
      setClaimNumber(`CLM-${yr}-${rand}`);
      setErrorMsg('');
    }
  }, [isOpen]);

  // Fetch invoices for selected patient
  const { data: patientInvoices = [] } = useQuery<Invoice[]>({
    queryKey: queryKeys.invoices.list({ patientId: selectedPatientId }),
    queryFn: async () => {
      if (!selectedPatientId) return [];
      const res = await api.invoices.list({ patient_id: selectedPatientId });
      return res.ok ? res.data.items : [];
    },
    enabled: !!selectedPatientId && isOpen,
  });

  // Selected invoice object
  const selectedInvoice = useMemo(
    () => patientInvoices.find((inv: Invoice) => inv.id === selectedInvoiceId),
    [patientInvoices, selectedInvoiceId]
  );

  // Selected company object
  const selectedCompany = useMemo(
    () => companies.find((c: InsuranceCompany) => c.id === selectedCompanyId),
    [companies, selectedCompanyId]
  );

  // Calculate suggested claimed amount based on invoice and company coverage
  useEffect(() => {
    if (selectedInvoice && selectedCompany) {
      const coverageRate = (selectedCompany.coverage_percent_default ?? 80) / 100;
      const invoiceTotalHalalas = selectedInvoice.total_halalas;
      const suggestedHalalas = Math.round(invoiceTotalHalalas * coverageRate);
      setClaimedSar((suggestedHalalas / 100).toFixed(2));
    }
  }, [selectedInvoice, selectedCompany]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatientId) throw new Error('يرجى اختيار المريض');
      if (!selectedInvoiceId) throw new Error('يرجى اختيار الفاتورة المراد المطالبة بها');
      if (!selectedCompanyId) throw new Error('يرجى اختيار شركة التأمين');
      if (!claimedSar || parseFloat(claimedSar) <= 0) throw new Error('يرجى تحديد المبلغ المطالب به');

      const claimedHalalas = Math.round(parseFloat(claimedSar) * 100);
      const now = new Date().toISOString();
      const payload: CreateInsuranceClaim = {
        clinic_id: 'c1000000-0000-0000-0000-000000000001',
        patient_id: selectedPatientId,
        invoice_id: selectedInvoiceId,
        company_id: selectedCompanyId,
        claim_number: claimNumber.trim() || `CLM-${Date.now()}`,
        claimed_halalas: claimedHalalas,
        approved_halalas: 0,
        rejected_halalas: 0,
        status: 'submitted',
        submitted_at: now,
        response_at: null,
        attachments: attachments,
        rejection_reason: null,
      };

      const res = await api.insurance.createClaim(payload);
      if (!res.ok) throw new Error(res.error || 'فشل إنشاء المطالبة');
      return res.data;
    },
    onSuccess: (newClaim: InsuranceClaim) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.insurance.claims() });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.insurance.auditLogs() });
      if (onClaimCreated) {
        onClaimCreated(newClaim);
      }
      onClose();
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || 'حدث خطأ أثناء إنشاء المطالبة');
    },
  });

  if (!isOpen) return null;

  const handleAddAttachment = () => {
    if (!newAttachmentText.trim()) return;
    const name = newAttachmentText.trim();
    if (!attachments.some((a) => a.file_name === name)) {
      setAttachments([
        ...attachments,
        {
          type: name.includes('أشعة') ? 'xray' : 'report',
          file_name: name,
          file_path: `/uploads/docs/${Date.now()}.pdf`,
        },
      ]);
    }
    setNewAttachmentText('');
  };

  const handleRemoveAttachment = (fileName: string) => {
    setAttachments(attachments.filter((a) => a.file_name !== fileName));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                إنشاء مطالبة تأمين طبي جديدة
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                ربط الفاتورة والإجراءات بشركة التأمين وإرفاق التقارير الطبية
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

        {/* Content */}
        <div className="max-h-[78vh] overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Patient Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              اختيار المريض <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => {
                setSelectedPatientId(e.target.value);
                setSelectedInvoiceId('');
              }}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">-- اختر مريضاً من القائمة --</option>
              {patients.map((p: Patient) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.father_name || ''} {p.family_name} ({p.code}) - {p.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Patient Insurance Badge Details */}
          {selectedPatient && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  بيانات التأمين المسجلة للمريض:
                </span>
                {selectedPatient.insurance_expiry ? (
                  <span className="text-[11px] text-zinc-500">
                    تاريخ انتهاء الوثيقة: {selectedPatient.insurance_expiry}
                  </span>
                ) : (
                  <span className="text-[11px] text-rose-500 font-bold">
                    لا يوجد تاريخ انتهاء مسجل
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-zinc-600 dark:text-zinc-400">
                <div>
                  <span className="text-zinc-400 block text-[10px]">رقم البوليصة:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedPatient.insurance_policy_no || 'غير مسجل'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">الشركة المعتمدة:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedCompany ? selectedCompany.name : 'غير محددة'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Company & Claim Number Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                شركة التأمين <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">-- اختر شركة التأمين --</option>
                {companies.map((c: InsuranceCompany) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (تغطية {c.coverage_percent_default}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                رقم المطالبة
              </label>
              <input
                type="text"
                value={claimNumber}
                onChange={(e) => setClaimNumber(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-mono text-zinc-900 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* 3. Invoice Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              اختيار الفاتورة المراد المطالبة بها <span className="text-rose-500">*</span>
            </label>
            {!selectedPatientId ? (
              <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-center text-xs text-zinc-400">
                يرجى اختيار المريض أولاً لعرض فواتيره غير المسددة
              </div>
            ) : patientInvoices.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                لا توجد فواتير مسجلة لهذا المريض
              </div>
            ) : (
              <select
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">-- اختر الفاتورة --</option>
                {patientInvoices.map((inv: Invoice) => (
                  <option key={inv.id} value={inv.id}>
                    فاتورة {inv.number} | الإجمالي: {(inv.total_halalas / 100).toFixed(2)} ر.س | المتبقي: {(inv.balance_halalas / 100).toFixed(2)} ر.س ({inv.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 4. Claimed Amount and Calculation Details */}
          {selectedInvoice && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  احتساب مبلغ المطالبة
                </span>
                <span className="text-xs text-zinc-500">
                  إجمالي الفاتورة: {(selectedInvoice.total_halalas / 100).toFixed(2)} ر.س
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                    المبلغ المطالب به من التأمين (ر.س):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={claimedSar}
                    onChange={(e) => setClaimedSar(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-bold text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-blue-300"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                    نسبة التغطية المطبقة:
                  </label>
                  <div className="h-9 flex items-center px-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-sm text-zinc-800 dark:text-zinc-200">
                    {selectedCompany?.coverage_percent_default ?? 80}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Medical Reports and Attachments */}
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 mb-2">
              <Paperclip className="h-3.5 w-3.5 text-primary" />
              المرفقات والأشعة المطلوبة للموافقة
            </label>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {attachments.map((item) => (
                <span
                  key={item.file_name}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <Check className="h-3 w-3 text-emerald-600" />
                  {item.file_name}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(item.file_name)}
                    className="rounded-full hover:bg-zinc-200 p-0.5 text-zinc-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newAttachmentText}
                onChange={(e) => setNewAttachmentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAttachment();
                  }
                }}
                placeholder="إضافة مستند أو أشعة أخرى (مثال: صورة أشعة CBCT، تقرير أخصائي الجذور)..."
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {createMutation.isPending ? 'جاري الإرسال...' : 'إنشاء وتقديم المطالبة'}
          </button>
        </div>
      </div>
    </div>
  );
};
