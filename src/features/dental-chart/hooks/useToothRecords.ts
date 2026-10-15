import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import type {
  ToothRecord,
  ToothCondition,
  ToothSurface,
  ToothRecordStatus,
  Treatment,
  TreatmentPlan,
  Procedure,
} from '@shared/contracts';

export interface UseToothRecordsOptions {
  patientId: string;
  clinicId?: string;
  dentistId?: string;
  timelineDate?: string | null; // If set, filters records recorded up to this date
}

export function useToothRecords({
  patientId,
  clinicId = 'c1000000-0000-0000-0000-000000000001',
  dentistId = 'u1000000-0000-0000-0000-000000000002',
  timelineDate = null,
}: UseToothRecordsOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 1. Fetch Tooth Records
  const {
    data: recordsResult,
    isLoading: isRecordsLoading,
    refetch: refetchRecords,
  } = useQuery({
    queryKey: ['toothRecords', patientId],
    queryFn: () => api.toothRecords.getByPatient(patientId),
    enabled: !!patientId,
  });

  const allRecords: ToothRecord[] = recordsResult?.ok ? recordsResult.data : [];

  // Filter by timeline date if comparison mode active
  const filteredRecords = timelineDate
    ? allRecords.filter((r) => new Date(r.recorded_at) <= new Date(timelineDate))
    : allRecords;

  // 2. Fetch Treatments for this patient
  const { data: treatmentsResult } = useQuery({
    queryKey: ['treatments', { patient_id: patientId }],
    queryFn: () =>
      api.treatments.list({
        patient_id: patientId,
        page: 1,
        limit: 200,
        sort_order: 'desc',
      }),
    enabled: !!patientId,
  });
  const treatments: Treatment[] = treatmentsResult?.ok ? treatmentsResult.data.items : [];

  // 3. Fetch Treatment Plans
  const { data: plansResult } = useQuery({
    queryKey: ['treatmentPlans', patientId],
    queryFn: () => api.treatments.getPlansByPatient(patientId),
    enabled: !!patientId,
  });
  const treatmentPlans: TreatmentPlan[] = plansResult?.ok ? plansResult.data : [];

  // 4. Fetch Procedures
  const { data: proceduresResult } = useQuery({
    queryKey: ['procedures', 'all'],
    queryFn: () => api.treatments.getProcedures({ page: 1, limit: 100, sort_order: 'asc' }),
  });
  const allProcedures: Procedure[] = proceduresResult?.ok ? proceduresResult.data.items : [];
  const toothProcedures = allProcedures.filter((p) => p.requires_tooth);

  // Mutation: Upsert / Save Tooth Record
  const saveRecordMutation = useMutation({
    mutationFn: async (data: {
      tooth_number: number;
      condition: ToothCondition;
      surface?: ToothSurface;
      status?: ToothRecordStatus;
      note?: string | null;
      treatment_id?: string | null;
    }) => {
      return api.toothRecords.saveRecord({
        clinic_id: clinicId,
        patient_id: patientId,
        tooth_number: data.tooth_number,
        condition: data.condition,
        surface: data.surface || 'whole',
        status: data.status || 'existing',
        treatment_id: data.treatment_id || null,
        note: data.note || null,
        recorded_at: new Date().toISOString(),
        recorded_by: dentistId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['toothRecords', patientId] });
      toast({
        title: `تم تحديث السن #${variables.tooth_number}`,
        description: `تم حفظ الحالة (${variables.condition}) بنجاح`,
        variant: 'success',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'فشل في حفظ سجل السن',
        description: err.message || 'حدث خطأ غير متوقع',
        variant: 'error',
      });
    },
  });

  // Mutation: Batch update for Quick Exam mode
  const batchUpdateMutation = useMutation({
    mutationFn: async (data: {
      toothNumbers: number[];
      condition: ToothCondition;
      status?: ToothRecordStatus;
    }) => {
      const promises = data.toothNumbers.map((num) =>
        api.toothRecords.saveRecord({
          clinic_id: clinicId,
          patient_id: patientId,
          tooth_number: num,
          condition: data.condition,
          surface: 'whole',
          status: data.status || 'existing',
          treatment_id: null,
          note: `فحص سريع (${new Date().toLocaleDateString('ar-SA')})`,
          recorded_at: new Date().toISOString(),
          recorded_by: dentistId,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['toothRecords', patientId] });
      toast({
        title: 'وضع الفحص السريع',
        description: `تم تطبيق الحالة على ${variables.toothNumbers.length} أسنان`,
        variant: 'success',
      });
    },
  });

  // Mutation: Quick Action -> Adds item to Treatment Plan (planned) & updates chart
  const addProcedureToPlanMutation = useMutation({
    mutationFn: async (data: {
      tooth_number: number;
      procedure: Procedure;
      surface?: ToothSurface;
      condition?: ToothCondition;
      notes?: string;
    }) => {
      // Find or create draft treatment plan
      let activePlan = treatmentPlans.find(
        (p) => p.status === 'draft' || p.status === 'proposed'
      );

      if (!activePlan) {
        const createPlanRes = await api.treatments.createPlan({
          clinic_id: clinicId,
          patient_id: patientId,
          dentist_id: dentistId,
          title: `خطة علاجية - ${new Date().toLocaleDateString('ar-SA')}`,
          status: 'draft',
          total_halalas: data.procedure.default_price_halalas,
          discount_halalas: 0,
          patient_consent_at: null,
          notes: 'تم إنشاؤها عبر مخطط الأسنان التفاعلي',
        });
        if (!createPlanRes.ok) throw new Error(createPlanRes.error);
        activePlan = createPlanRes.data;
      }

      // 1. Record tooth condition as planned
      const resultingCondition: ToothCondition =
        data.condition ||
        (data.procedure.category === 'restorative'
          ? 'filled'
          : data.procedure.category === 'endodontics'
          ? 'root_canal'
          : data.procedure.category === 'oral_surgery'
          ? 'to_extract'
          : data.procedure.category === 'prosthodontics'
          ? 'crown'
          : 'healthy');

      await api.toothRecords.saveRecord({
        clinic_id: clinicId,
        patient_id: patientId,
        tooth_number: data.tooth_number,
        condition: resultingCondition,
        surface: data.surface || 'whole',
        status: 'planned', // Planned procedure
        treatment_id: null,
        note: `خطة علاج: ${data.procedure.name_ar} ${data.notes ? `(${data.notes})` : ''}`,
        recorded_at: new Date().toISOString(),
        recorded_by: dentistId,
      });

      return { plan: activePlan, procedure: data.procedure };
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['toothRecords', patientId] });
      queryClient.invalidateQueries({ queryKey: ['treatmentPlans', patientId] });
      toast({
        title: 'تمت الإضافة لخطة العلاج',
        description: `تم إدراج ${variables.procedure.name_ar} للسن #${variables.tooth_number} كإجراء مقترح`,
        variant: 'success',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'فشل في إضافة الإجراء للخطة',
        description: err.message || 'حدث خطأ',
        variant: 'error',
      });
    },
  });

  return {
    records: filteredRecords,
    allRecords,
    treatments,
    treatmentPlans,
    procedures: allProcedures,
    toothProcedures,
    isLoading: isRecordsLoading,
    refetchRecords,
    saveRecord: saveRecordMutation.mutateAsync,
    isSaving: saveRecordMutation.isPending,
    batchUpdate: batchUpdateMutation.mutateAsync,
    isBatchUpdating: batchUpdateMutation.isPending,
    addProcedureToPlan: addProcedureToPlanMutation.mutateAsync,
    isAddingToPlan: addProcedureToPlanMutation.isPending,
  };
}
