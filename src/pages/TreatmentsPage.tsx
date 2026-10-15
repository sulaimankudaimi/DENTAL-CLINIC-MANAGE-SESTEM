import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { formatCurrency, formatDateAr } from '@/lib/formatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Odontogram } from '@/components/dental/Odontogram';
import type { CreateTreatment, ToothCondition, ToothSurface, Procedure } from '@shared/contracts';
import { InvoiceFormModal } from '@/components/billing/InvoiceFormModal';
import {
  Stethoscope,
  Receipt,
  User,
} from 'lucide-react';

export const TreatmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  // New treatment log form states
  const [procId, setProcId] = useState('');
  const [dentistId, setDentistId] = useState('');
  const [toothSurface, setToothSurface] = useState<string>('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [anesthesiaType, setAnesthesiaType] = useState('infiltration');
  const [priceHalalas, setPriceHalalas] = useState(25000);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Fetch Patients
  const { data: patients = [] } = useQuery({
    queryKey: queryKeys.patients.all,
    queryFn: async () => {
      const res = await api.patients.list({ page: 1, limit: 100, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
  });

  // Automatically select first patient if none selected
  const activePatientId = selectedPatientId || (patients[0]?.id ?? '');

  // Fetch Procedures
  const { data: procedures = [] } = useQuery<Procedure[]>({
    queryKey: queryKeys.treatments.procedures(),
    queryFn: async () => {
      const res = await api.treatments.getProcedures({ page: 1, limit: 100, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
  });

  // Fetch Dentists
  const { data: dentists = [] } = useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: async () => {
      const res = await api.staff.list({ role: 'dentist', page: 1, limit: 100, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
  });

  // Fetch Tooth Records for active patient
  const { data: toothRecords = [] } = useQuery({
    queryKey: queryKeys.toothRecords.byPatient(activePatientId),
    queryFn: async () => {
      if (!activePatientId) return [];
      const res = await api.toothRecords.getByPatient(activePatientId);
      return res.ok ? res.data : [];
    },
    enabled: !!activePatientId,
  });

  // Fetch Treatments for active patient
  const { data: treatments = [] } = useQuery({
    queryKey: queryKeys.treatments.list({ patient_id: activePatientId }),
    queryFn: async () => {
      if (!activePatientId) return [];
      const res = await api.treatments.list({ patient_id: activePatientId, page: 1, limit: 100, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
    enabled: !!activePatientId,
  });

  // Tooth update mutation
  const updateToothMutation = useMutation({
    mutationFn: async ({ toothNumber, condition }: { toothNumber: number; condition: ToothCondition }) => {
      if (!activePatientId) return;
      return api.toothRecords.saveRecord({
        clinic_id: 'c1000000-0000-0000-0000-000000000001',
        patient_id: activePatientId,
        tooth_number: toothNumber,
        surface: 'whole',
        condition,
        status: 'existing',
        treatment_id: null,
        note: null,
        recorded_at: new Date().toISOString(),
        recorded_by: dentistId || dentists[0]?.id || '00000000-0000-0000-0000-000000000001',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.toothRecords.byPatient(activePatientId) });
    },
  });

  // Create Treatment Mutation
  const createTreatmentMutation = useMutation({
    mutationFn: async (payload: CreateTreatment) => {
      return api.treatments.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments.list({ patient_id: activePatientId }) });
      setClinicalNotes('');
    },
  });

  const activePatient = patients.find((p) => p.id === activePatientId);

  const handleProcedureSelect = (id: string) => {
    setProcId(id);
    const p = procedures.find((x) => x.id === id);
    if (p) {
      setPriceHalalas(p.default_price_halalas);
    }
  };

  const handleLogTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatientId) return;

    const chosenDentistId = dentistId || (dentists[0]?.id ?? 'u1000000-0000-0000-0000-000000000001');

    createTreatmentMutation.mutate({
      clinic_id: 'c1000000-0000-0000-0000-000000000001',
      patient_id: activePatientId,
      appointment_id: null,
      plan_item_id: null,
      procedure_id: procId || (procedures[0]?.id ?? 'p1000000-0000-0000-0000-000000000001'),
      dentist_id: chosenDentistId,
      tooth_number: selectedTooth ?? null,
      surface: (toothSurface as ToothSurface) || null,
      performed_at: new Date().toISOString(),
      status: 'completed',
      anesthesia_type: anesthesiaType || null,
      materials_used: [],
      clinical_notes: clinicalNotes.trim() || null,
      price_halalas: priceHalalas,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="مخطط الأسنان والخطة العلاجية"
        description="فحص الأسنان التفاعلي (Odontogram)، تسجيل التشخيص السريري، وتوثيق الإجراءات العلاجية"
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsInvoiceModalOpen(true)}
          >
            <Receipt className="w-4 h-4 me-1.5 inline" />
            إصدار فاتورة للمريض
          </Button>
        }
      />

      {/* Patient Selection Bar */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-navy/10 flex items-center justify-center text-brand-navy">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-64">
            <Select
              label="المريض المحدد حالياً"
              value={activePatientId}
              onValueChange={(val) => {
                setSelectedPatientId(val);
                setSelectedTooth(null);
              }}
              options={patients.map((p) => ({
                label: `${p.first_name} ${p.family_name} (${p.code})`,
                value: p.id,
              }))}
            />
          </div>
        </div>

        {activePatient && (
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span className="font-mono">{activePatient.phone}</span>
            {activePatient.blood_type && activePatient.blood_type !== 'unknown' && (
              <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold">
                {activePatient.blood_type}
              </span>
            )}
            {activePatient.notes && (
              <Badge variant="danger">ملاحظات: {activePatient.notes}</Badge>
            )}
          </div>
        )}
      </div>

      {/* Interactive Odontogram Component */}
      <Odontogram
        records={toothRecords}
        selectedTooth={selectedTooth}
        onSelectTooth={(toothNum) => setSelectedTooth(toothNum)}
        onUpdateToothCondition={(toothNum, condition) => {
          updateToothMutation.mutate({ toothNumber: toothNum, condition });
        }}
      />

      {/* Clinical Treatment Logger & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Treatment Log Form (1 Col) */}
        <div className="bg-surface-card rounded-xl border border-surface-border shadow-xs p-5">
          <div className="flex items-center gap-2 border-b border-surface-border/50 pb-3 mb-4">
            <Stethoscope className="w-4 h-4 text-brand-navy" />
            <h3 className="text-sm font-bold text-text-primary">
              توثيق إجراء علاجي
              {selectedTooth && <span className="text-brand-navy ms-1">(السن #{selectedTooth})</span>}
            </h3>
          </div>

          <form onSubmit={handleLogTreatment} className="space-y-4">
            <Select
              label="الإجراء الطبي المنجز *"
              value={procId}
              onValueChange={handleProcedureSelect}
              options={procedures.map((p) => ({
                label: `${p.name_ar} (${formatCurrency(p.default_price_halalas)})`,
                value: p.id,
              }))}
              required
            />

            <Select
              label="الطبيب المعالج *"
              value={dentistId}
              onValueChange={setDentistId}
              options={dentists.map((d) => ({
                label: `د. ${d.full_name}`,
                value: d.id,
              }))}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="السطح المعالج"
                value={toothSurface}
                onValueChange={setToothSurface}
                options={[
                  { label: 'السن كاملاً (Whole)', value: 'whole' },
                  { label: 'الإطباقي (O)', value: 'O' },
                  { label: 'الدهليزي (B)', value: 'B' },
                  { label: 'اللساني (L)', value: 'L' },
                  { label: 'الوسطي (M)', value: 'M' },
                  { label: 'القاصي (D)', value: 'D' },
                ]}
              />
              <Select
                label="نوع التخدير"
                value={anesthesiaType}
                onValueChange={setAnesthesiaType}
                options={[
                  { label: 'ارتشاحي (Infiltration)', value: 'infiltration' },
                  { label: 'كتلي / فكي (Block)', value: 'block' },
                  { label: 'موضعي سطحي (Topical)', value: 'topical' },
                  { label: 'بدون تخدير', value: 'none' },
                ]}
              />
            </div>

            <Input
              label="المبلغ المطلوب (ر.س)"
              type="number"
              step="1"
              value={priceHalalas / 100}
              onChange={(e) => setPriceHalalas(Math.round(Number(e.target.value) * 100))}
              required
            />

            <Textarea
              label="الملاحظات والتقرير السريري"
              placeholder="اكتب تفاصيل الإجراء، المواد المستخدمة، وملاحظات المتابعة..."
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={createTreatmentMutation.isPending}
            >
              {createTreatmentMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإجراء في الملف السريري'}
            </Button>
          </form>
        </div>

        {/* Treatment History Table (2 Cols) */}
        <div className="lg:col-span-2 bg-surface-card rounded-xl border border-surface-border shadow-xs overflow-hidden">
          <div className="p-4 border-b border-surface-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary">
              سجل الإجراءات والعلاجات السابقة ({treatments.length})
            </h3>
          </div>

          {treatments.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-xs">
              لم يتم توثيق أي إجراءات علاجية لهذا المريض حتى الآن.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-surface-hover font-bold text-text-secondary border-b border-surface-border">
                  <tr>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">الإجراء</th>
                    <th className="p-3 text-center">السن</th>
                    <th className="p-3 text-center">السطح</th>
                    <th className="p-3">الطبيب</th>
                    <th className="p-3 text-left pl-4">القيمة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50">
                  {treatments.map((t) => {
                    const proc = procedures.find((p) => p.id === t.procedure_id);
                    const doc = dentists.find((d) => d.id === t.dentist_id);
                    return (
                      <tr key={t.id} className="hover:bg-surface-hover/50">
                        <td className="p-3 text-text-secondary">{formatDateAr(t.performed_at)}</td>
                        <td className="p-3 font-semibold text-text-primary">
                          {proc?.name_ar || 'إجراء علاجي'}
                          {t.clinical_notes && (
                            <p className="text-[11px] text-text-muted mt-0.5">{t.clinical_notes}</p>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-brand-navy">
                          {t.tooth_number ? `#${t.tooth_number}` : '—'}
                        </td>
                        <td className="p-3 text-center">
                          {t.surface ? <Badge variant="outline">{t.surface}</Badge> : '—'}
                        </td>
                        <td className="p-3 text-text-secondary">{doc ? `د. ${doc.full_name}` : '—'}</td>
                        <td className="p-3 text-left pl-4 font-bold text-text-primary">
                          {formatCurrency(t.price_halalas)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Generator Modal */}
      {isInvoiceModalOpen && (
        <InvoiceFormModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          defaultPatientId={activePatientId}
          onSubmit={async (invoiceData) => {
            await api.invoices.create(invoiceData);
            setIsInvoiceModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default TreatmentsPage;
