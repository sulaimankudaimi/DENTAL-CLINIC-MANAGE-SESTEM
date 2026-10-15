import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { TreatmentPlan, Treatment, Procedure, Patient, TreatmentPlanItem } from '@shared/contracts';
import { formatCurrency, formatDateAr } from '@/lib/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TreatmentPlanBuilder } from '@/features/treatment-plans/TreatmentPlanBuilder';
import { PatientPresentationModal } from '@/features/treatment-plans/components/PatientPresentationModal';
import { AcceptPlanDialog } from '@/features/treatment-plans/components/AcceptPlanDialog';
import { TreatmentExecutionDialog } from '@/features/treatments/TreatmentExecutionDialog';
import {
  FileText,
  Plus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  AlertCircle,
  Printer,
  Edit,
  PlayCircle,
  Layers,
} from 'lucide-react';
import { TREATMENT_PLAN_STATUS_AR } from '@shared/contracts';

export interface PatientTreatmentPlanTabProps {
  patient?: Patient;
  plans: TreatmentPlan[];
  treatments: Treatment[];
  procedures: Procedure[];
  onAddPlan?: () => void;
}

export const PatientTreatmentPlanTab: React.FC<PatientTreatmentPlanTabProps> = ({
  patient,
  plans,
  treatments,
  procedures,
}) => {
  const queryClient = useQueryClient();

  // Mode: 'list' or 'builder'
  const [viewMode, setViewMode] = useState<'list' | 'builder'>('list');
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<
    (TreatmentPlan & { items?: TreatmentPlanItem[] }) | null
  >(null);

  // Expanded plan in list
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(
    plans.length > 0 ? plans[0].id : null
  );

  // Dialogs
  const [presentationPlan, setPresentationPlan] = useState<TreatmentPlan | null>(null);
  const [acceptDialogPlan, setAcceptDialogPlan] = useState<TreatmentPlan | null>(null);
  const [isExecutionOpen, setIsExecutionOpen] = useState(false);
  const [executionTooth, setExecutionTooth] = useState<number | null>(null);
  const [executionProcId, setExecutionProcId] = useState<string | undefined>(undefined);

  // Fetch plan items when a plan is selected for presentation or acceptance
  const activePlanId = presentationPlan?.id || acceptDialogPlan?.id || selectedPlanForEdit?.id;
  const { data: activePlanData } = useQuery({
    queryKey: ['treatments', 'planDetail', activePlanId],
    queryFn: async () => {
      if (!activePlanId) return null;
      if (api.treatments.getPlanById) {
        const res = await api.treatments.getPlanById(activePlanId);
        return res.ok ? res.data : null;
      }
      return null;
    },
    enabled: !!activePlanId,
  });

  const getProcedure = (procId: string) => {
    return procedures.find((p) => p.id === procId);
  };

  const handleStartNewPlan = () => {
    setSelectedPlanForEdit(null);
    setViewMode('builder');
  };

  const handleEditPlan = async (plan: TreatmentPlan) => {
    let fullPlan: TreatmentPlan & { items?: TreatmentPlanItem[] } = plan;
    if (api.treatments.getPlanById) {
      const res = await api.treatments.getPlanById(plan.id);
      if (res.ok) fullPlan = res.data;
    }
    setSelectedPlanForEdit(fullPlan);
    setViewMode('builder');
  };

  // If in builder mode and patient is provided
  if (viewMode === 'builder' && patient) {
    return (
      <TreatmentPlanBuilder
        patient={patient}
        existingPlan={selectedPlanForEdit}
        onBack={() => setViewMode('list')}
        onPlanSaved={() => {
          setViewMode('list');
          queryClient.invalidateQueries({ queryKey: queryKeys.treatments.plans(patient.id) });
        }}
      />
    );
  }

  return (
    <div id="patient-treatment-plan-tab" className="space-y-6">
      {/* Header with stats and action */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-navy flex items-center justify-center">
            <Layers className="w-6 h-6 text-[#1E4E9C]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              الخطط العلاجية المتكاملة والمراحل السريرية
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              تخطيط مراحل التدخل، حساب التكلفة الدقيقة حتى الهللة، ومتابعة الموافقة المستنيرة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {patient && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExecutionTooth(null);
                setExecutionProcId(undefined);
                setIsExecutionOpen(true);
              }}
              icon={<PlayCircle className="w-4 h-4 text-emerald-600" />}
              className="text-xs"
            >
              تنفيذ إجراء سريري مباشر
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleStartNewPlan}
            icon={<Plus className="w-4 h-4" />}
            className="text-xs shadow-sm bg-[#1E4E9C]"
          >
            إنشاء خطة علاجية جديدة
          </Button>
        </div>
      </div>

      {/* Plans List */}
      {plans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-brand-navy mx-auto flex items-center justify-center">
            <Stethoscope className="w-8 h-8 text-[#1E4E9C]" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">لا توجد خطط علاجية مسجلة لهذا المريض</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              ابدأ بإنشاء أول خطة علاجية لتنظيم مراحل العلاج (Phase 1, 2, 3)، حساب التكلفة، وطباعة مقترح الموافقة
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleStartNewPlan}
            icon={<Plus className="w-4 h-4" />}
            className="text-xs"
          >
            تصميم خطة علاجية الآن
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const isExpanded = expandedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
              >
                {/* Plan Card Header */}
                <div
                  onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                  className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 select-none border-b border-transparent"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-blue-50 text-brand-navy shrink-0">
                      <FileText className="w-6 h-6 text-[#1E4E9C]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="font-bold text-sm text-slate-900">{plan.title}</h4>
                        <Badge
                          variant={
                            plan.status === 'completed'
                              ? 'success'
                              : plan.status === 'in_progress'
                              ? 'default'
                              : plan.status === 'accepted'
                              ? 'ok'
                              : 'outline'
                          }
                          className="text-[11px]"
                        >
                          {TREATMENT_PLAN_STATUS_AR[plan.status] || plan.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        تاريخ الإنشاء: {formatDateAr(plan.created_at)}
                        {plan.patient_consent_at && (
                          <span className="text-emerald-700 mr-2 font-medium">
                            • تم قبول الخطة وتوقيع الموافقة: {formatDateAr(plan.patient_consent_at)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="text-left">
                      <span className="text-[11px] text-slate-500 block">إجمالي صافي الخطة</span>
                      <span className="text-base font-extrabold text-[#1E4E9C] font-mono">
                        {formatCurrency(plan.total_halalas)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPlan(plan)}
                        icon={<Edit className="w-3.5 h-3.5" />}
                        className="text-xs py-1"
                        title="تعديل الخطة في المحرر"
                      >
                        تعديل
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPresentationPlan(plan)}
                        icon={<Printer className="w-3.5 h-3.5" />}
                        className="text-xs py-1"
                        title="عرض قابل للطباعة مع توقيع المريض"
                      >
                        عرض PDF
                      </Button>

                      {plan.status !== 'accepted' && plan.status !== 'completed' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setAcceptDialogPlan(plan)}
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          className="text-xs py-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          قبول الخطة
                        </Button>
                      )}
                    </div>

                    <div className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Plan Details / Treatments table (when expanded) */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
                    {plan.notes && (
                      <div className="bg-amber-50/70 border border-amber-200/60 p-3.5 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold">ملاحظات وتوصيات الطبيب:</strong>
                          <p className="mt-0.5">{plan.notes}</p>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-xs text-right">
                        <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                          <tr>
                            <th className="p-3">الإجراء السريري</th>
                            <th className="p-3 text-center">السن</th>
                            <th className="p-3 text-center">السطح</th>
                            <th className="p-3 text-center">السعر</th>
                            <th className="p-3 text-left pl-4">الحالة والتنفيذ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {treatments.filter((t) => t.plan_item_id === plan.id || t.patient_id === plan.patient_id).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400">
                                بنود الخطة العلاجية قيد المراجعة أو الاعتماد
                              </td>
                            </tr>
                          ) : (
                            treatments
                              .filter((t) => t.plan_item_id === plan.id || t.patient_id === plan.patient_id)
                              .map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                  <td className="p-3 font-semibold text-slate-900">
                                    {getProcedure(item.procedure_id)?.name_ar || 'إجراء علاجي'}
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold text-brand-navy">
                                    {item.tooth_number ? `#${item.tooth_number}` : 'عام'}
                                  </td>
                                  <td className="p-3 text-center text-slate-600 font-mono">
                                    {item.surface || '—'}
                                  </td>
                                  <td className="p-3 text-center font-semibold text-slate-800">
                                    {formatCurrency(item.price_halalas)}
                                  </td>
                                  <td className="p-3 text-left pl-4">
                                    <div className="flex items-center justify-end gap-2">
                                      <Badge
                                        variant={item.status === 'completed' ? 'success' : 'default'}
                                        className="text-[10px]"
                                      >
                                        {item.status === 'completed' ? 'منفذ بنجاح' : 'مجدول'}
                                      </Badge>
                                      {item.status !== 'completed' && patient && (
                                        <button
                                          onClick={() => {
                                            setExecutionTooth(item.tooth_number);
                                            setExecutionProcId(item.procedure_id);
                                            setIsExecutionOpen(true);
                                          }}
                                          className="p-1 rounded text-emerald-600 hover:bg-emerald-50 text-[11px] flex items-center gap-1 font-semibold"
                                          title="تنفيذ وتوثيق الجلسة السريرية"
                                        >
                                          <PlayCircle className="w-3.5 h-3.5" />
                                          <span>تنفيذ</span>
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Performed Treatment History Log */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            سجل الإجراءات والجلسات السريرية المنفذة فعلياً
          </h4>
          <span className="text-xs text-slate-500 font-medium">
            إجمالي المنفذ: {treatments.filter((t) => t.status === 'completed').length} إجراء
          </span>
        </div>

        {treatments.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8 bg-slate-50 rounded-xl">
            لم يتم تسجيل أي إجراءات منفذة حتى الآن
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">تاريخ التنفيذ</th>
                  <th className="p-3">الإجراء العلاجي</th>
                  <th className="p-3 text-center">السن</th>
                  <th className="p-3 text-center">السطح</th>
                  <th className="p-3 text-center">المبلغ</th>
                  <th className="p-3">ملاحظات سريرية</th>
                  <th className="p-3 text-left pl-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {treatments.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-600 font-mono">
                      {formatDateAr(tr.performed_at)}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      {getProcedure(tr.procedure_id)?.name_ar || 'إجراء علاجي'}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-brand-navy">
                      {tr.tooth_number ? `#${tr.tooth_number}` : '—'}
                    </td>
                    <td className="p-3 text-center text-slate-600 font-mono">
                      {tr.surface || '—'}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-800">
                      {formatCurrency(tr.price_halalas)}
                    </td>
                    <td className="p-3 text-slate-600 max-w-[200px] truncate" title={tr.clinical_notes || ''}>
                      {tr.clinical_notes || '—'}
                    </td>
                    <td className="p-3 text-left pl-4">
                      <Badge variant={tr.status === 'completed' ? 'success' : 'default'} className="text-[10px]">
                        {tr.status === 'completed' ? 'منفذ' : 'قيد العلاج'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Presentation PDF Modal */}
      {presentationPlan && (
        <PatientPresentationModal
          isOpen={true}
          onClose={() => setPresentationPlan(null)}
          plan={presentationPlan}
          items={activePlanData?.items || []}
          procedures={procedures}
          patient={patient}
          insuranceCoveragePercent={patient?.insurance_policy_no ? 80 : 0}
        />
      )}

      {/* Accept Plan Atomic Dialog */}
      {acceptDialogPlan && (
        <AcceptPlanDialog
          isOpen={true}
          onClose={() => setAcceptDialogPlan(null)}
          plan={acceptDialogPlan}
          items={activePlanData?.items || []}
          procedures={procedures}
          patient={patient}
          onConfirm={async () => {
            if (api.treatments.acceptPlanTransaction && patient) {
              const res = await api.treatments.acceptPlanTransaction({
                planId: acceptDialogPlan.id,
                patientId: patient.id,
                dentistId: acceptDialogPlan.dentist_id,
                items: (activePlanData?.items || []).map((i) => ({
                  procedureId: i.procedure_id,
                  toothNumber: i.tooth_number,
                  surface: i.surface,
                  unitPriceHalalas: i.unit_price_halalas,
                  discountHalalas: i.discount_halalas,
                  quantity: i.quantity,
                  phase: i.phase,
                })),
              });
              if (!res.ok) throw new Error(typeof res.error === 'string' ? res.error : (res.error as any)?.message || 'فشل اعتماد الخطة');

              queryClient.invalidateQueries({ queryKey: queryKeys.treatments.plans(patient.id) });
              queryClient.invalidateQueries({ queryKey: queryKeys.treatments.list({ patient_id: patient.id }) });
              queryClient.invalidateQueries({ queryKey: queryKeys.toothRecords.byPatient(patient.id) });
              queryClient.invalidateQueries({ queryKey: queryKeys.invoices.list({ patient_id: patient.id }) });

              return res.data;
            }
            return null;
          }}
        />
      )}

      {/* Clinical Execution Dialog */}
      {isExecutionOpen && patient && (
        <TreatmentExecutionDialog
          isOpen={true}
          onClose={() => setIsExecutionOpen(false)}
          patientId={patient.id}
          patientName={[patient.first_name, patient.father_name, patient.family_name].filter(Boolean).join(' ') || patient.code}
          initialProcedureId={executionProcId}
          initialToothNumber={executionTooth}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.treatments.list({ patient_id: patient.id }) });
            queryClient.invalidateQueries({ queryKey: queryKeys.toothRecords.byPatient(patient.id) });
          }}
        />
      )}
    </div>
  );
};
export default PatientTreatmentPlanTab;
