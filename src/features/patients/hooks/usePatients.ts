import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type {
  Patient,
  CreatePatient,
  UpdatePatient,
  PatientFilters,
  CreateMedicalHistory,
  CreateAllergy,
  Paginated,
} from '@shared/contracts';
import { useMemo } from 'react';

export interface ExtendedPatientFilters extends Partial<PatientFilters> {
  lastVisitFilter?: 'all' | 'week' | 'month' | '3months' | '6months' | 'never';
}

export function usePatients(filters: ExtendedPatientFilters = {}) {
  const page = filters.page || 1;
  const limit = filters.limit || 25;

  const queryKey = queryKeys.patients.list({
    search: filters.search || '',
    gender: filters.gender,
    primary_dentist_id: filters.primary_dentist_id,
    insurance_company_id: filters.insurance_company_id,
    is_active: filters.is_active,
    has_insurance: filters.has_insurance,
    page,
    limit,
  });

  const {
    data: paginatedData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await api.patients.list({
        search: filters.search?.trim() || undefined,
        gender: filters.gender,
        primary_dentist_id: filters.primary_dentist_id || undefined,
        insurance_company_id: filters.insurance_company_id || undefined,
        is_active: filters.is_active,
        has_insurance: filters.has_insurance,
        page,
        limit,
        sort_by: 'created_at',
        sort_order: 'desc',
      });
      if (!res.ok) {
        const err = res.error as any;
        throw new Error(typeof err === 'string' ? err : err?.message || 'فشل تحميل بيانات المرضى');
      }
      return res.data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30, // 30 seconds
  });

  // Auxiliary data: Invoices for outstanding balance calculation
  const { data: invoicesData } = useQuery({
    queryKey: queryKeys.invoices.all,
    queryFn: async () => {
      const res = await api.invoices.list({ page: 1, limit: 1000, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
    staleTime: 1000 * 60,
  });

  // Auxiliary data: Completed Appointments/Treatments for Last Visit
  const { data: appointmentsData } = useQuery({
    queryKey: queryKeys.appointments.all,
    queryFn: async () => {
      const res = await api.appointments.list({ page: 1, limit: 1000, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
    staleTime: 1000 * 60,
  });

  // Map balances by patient ID
  const balancesByPatientId = useMemo(() => {
    const map = new Map<string, number>();
    if (!invoicesData) return map;
    for (const inv of invoicesData) {
      if (inv.patient_id && inv.status !== 'void' && inv.status !== 'paid') {
        const current = map.get(inv.patient_id) || 0;
        map.set(inv.patient_id, current + (inv.balance_halalas || 0));
      }
    }
    return map;
  }, [invoicesData]);

  // Map last visit by patient ID
  const lastVisitByPatientId = useMemo(() => {
    const map = new Map<string, string>();
    if (!appointmentsData) return map;
    for (const appt of appointmentsData) {
      if (appt.patient_id && (appt.status === 'completed' || appt.status === 'in_progress')) {
        const dateStr = appt.start_at;
        const existing = map.get(appt.patient_id);
        if (!existing || dateStr > existing) {
          map.set(appt.patient_id, dateStr);
        }
      }
    }
    return map;
  }, [appointmentsData]);

  // Client-side filtering for lastVisitFilter if specified
  const items = useMemo(() => {
    let list = paginatedData?.items || [];
    if (!filters.lastVisitFilter || filters.lastVisitFilter === 'all') {
      return list;
    }

    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    return list.filter((p) => {
      const lastVisit = lastVisitByPatientId.get(p.id);
      if (filters.lastVisitFilter === 'never') {
        return !lastVisit;
      }
      if (!lastVisit) return false;

      const diffDays = (now - new Date(lastVisit).getTime()) / oneDay;
      if (filters.lastVisitFilter === 'week') {
        return diffDays <= 7;
      }
      if (filters.lastVisitFilter === 'month') {
        return diffDays <= 30;
      }
      if (filters.lastVisitFilter === '3months') {
        return diffDays >= 90;
      }
      if (filters.lastVisitFilter === '6months') {
        return diffDays >= 180;
      }
      return true;
    });
  }, [paginatedData?.items, filters.lastVisitFilter, lastVisitByPatientId]);

  return {
    patients: items,
    total: paginatedData?.total || 0,
    totalPages: paginatedData?.totalPages || 1,
    currentPage: paginatedData?.page || page,
    limit,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    balancesByPatientId,
    lastVisitByPatientId,
  };
}

// Hook for fetching a single patient by ID
export function usePatient(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.patients.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const res = await api.patients.getById(id);
      if (!res.ok) {
        const err = res.error as any;
        throw new Error(typeof err === 'string' ? err : err?.message || 'فشل جلب بيانات المريض');
      }
      return res.data;
    },
    enabled: !!id,
  });
}

// Hook for fetching medical history of a patient
export function usePatientMedicalHistory(patientId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.patients.medicalHistory(patientId || ''),
    queryFn: async () => {
      if (!patientId) return [];
      const res = await api.patients.getMedicalHistory(patientId);
      if (!res.ok) return [];
      return res.data;
    },
    enabled: !!patientId,
  });
}

// Hook for fetching allergies of a patient
export function usePatientAllergies(patientId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.patients.allergies(patientId || ''),
    queryFn: async () => {
      if (!patientId) return [];
      const res = await api.patients.getAllergies(patientId);
      if (!res.ok) return [];
      return res.data;
    },
    enabled: !!patientId,
  });
}

// Hook to check for duplicates (phone or national_id)
export function useCheckPatientDuplicate() {
  const { data: allPatients } = useQuery({
    queryKey: ['patients', 'duplicate-check'],
    queryFn: async () => {
      const res = await api.patients.list({ page: 1, limit: 1000, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
    staleTime: 1000 * 30,
  });

  return {
    checkDuplicate: (
      phone?: string | null,
      nationalId?: string | null,
      excludePatientId?: string | null
    ): { isDuplicate: boolean; field?: 'phone' | 'national_id'; existingPatient?: Patient } => {
      if (!allPatients || allPatients.length === 0) {
        return { isDuplicate: false };
      }

      const cleanPhone = phone?.replace(/\D/g, '');
      const cleanNid = nationalId?.trim();

      for (const p of allPatients) {
        if (excludePatientId && p.id === excludePatientId) continue;

        if (cleanPhone && cleanPhone.length >= 9) {
          const pPhone = p.phone.replace(/\D/g, '');
          if (pPhone === cleanPhone || (pPhone.endsWith(cleanPhone) && cleanPhone.length >= 9)) {
            return { isDuplicate: true, field: 'phone', existingPatient: p };
          }
        }

        if (cleanNid && cleanNid.length >= 8 && p.national_id) {
          if (p.national_id.trim() === cleanNid) {
            return { isDuplicate: true, field: 'national_id', existingPatient: p };
          }
        }
      }

      return { isDuplicate: false };
    },
  };
}

// Hook to fetch next generated patient code
export function useNextPatientCode() {
  const { data: allPatients } = useQuery({
    queryKey: ['patients', 'code-generation'],
    queryFn: async () => {
      const res = await api.patients.list({ page: 1, limit: 1, sort_order: 'desc' });
      return res.ok ? res.data : null;
    },
  });

  return useMemo(() => {
    const total = allPatients?.total || 0;
    const nextNum = 1001 + total;
    return `P-${nextNum}`;
  }, [allPatients]);
}

// Hook to fetch dentists/staff
export function useDentists() {
  return useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: async () => {
      const res = await api.staff.list({ page: 1, limit: 100, sort_order: 'asc' });
      if (!res.ok) return [];
      return res.data.items.filter((u) => u.role === 'dentist' || u.role === 'owner');
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to fetch insurance companies
export function useInsuranceCompanies() {
  return useQuery({
    queryKey: queryKeys.insurance.companies,
    queryFn: async () => {
      const res = await api.insurance.getCompanies();
      if (!res.ok) return [];
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Mutation: Create Patient with Optimistic Update
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePatient) => {
      const res = await api.patients.create(payload);
      if (!res.ok) {
        const err = res.error as any;
        throw new Error(typeof err === 'string' ? err : err?.message || 'فشل إضافة المريض');
      }
      return res.data;
    },
    onMutate: async (newPatientData) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.patients.all });

      // Snapshot previous queries
      const previousPatientsQueries = queryClient.getQueriesData<Paginated<Patient>>({
        queryKey: queryKeys.patients.all,
      });

      // Optimistically insert dummy patient
      const optimisticPatient: Patient = {
        id: `temp-${Date.now()}`,
        clinic_id: newPatientData.clinic_id || 'c1000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        code: newPatientData.code || 'P-TEMP',
        first_name: newPatientData.first_name,
        father_name: newPatientData.father_name || null,
        family_name: newPatientData.family_name,
        gender: newPatientData.gender,
        birth_date: newPatientData.birth_date || null,
        national_id: newPatientData.national_id || null,
        phone: newPatientData.phone,
        phone_alt: newPatientData.phone_alt || null,
        email: newPatientData.email || null,
        address: newPatientData.address || null,
        city: newPatientData.city || 'الرياض',
        blood_type: newPatientData.blood_type || 'unknown',
        marital_status: newPatientData.marital_status || 'single',
        occupation: newPatientData.occupation || null,
        emergency_contact_name: newPatientData.emergency_contact_name || null,
        emergency_contact_phone: newPatientData.emergency_contact_phone || null,
        referral_source: newPatientData.referral_source || null,
        primary_dentist_id: newPatientData.primary_dentist_id || null,
        insurance_company_id: newPatientData.insurance_company_id || null,
        insurance_policy_no: newPatientData.insurance_policy_no || null,
        insurance_expiry: newPatientData.insurance_expiry || null,
        notes: newPatientData.notes || null,
        photo_path: newPatientData.photo_path || null,
        is_active: newPatientData.is_active ?? true,
      };

      queryClient.setQueriesData<Paginated<Patient>>(
        { queryKey: queryKeys.patients.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            total: old.total + 1,
            items: [optimisticPatient, ...old.items],
          };
        }
      );

      return { previousPatientsQueries };
    },
    onError: (_err, _newPatient, context) => {
      // Rollback
      if (context?.previousPatientsQueries) {
        for (const [queryKey, data] of context.previousPatientsQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todaySummary });
      queryClient.invalidateQueries({ queryKey: ['patients', 'duplicate-check'] });
      queryClient.invalidateQueries({ queryKey: ['patients', 'code-generation'] });
    },
  });
}

// Mutation: Update Patient with Optimistic Update
export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePatient }) => {
      const res = await api.patients.update(id, data);
      if (!res.ok) {
        const err = res.error as any;
        throw new Error(typeof err === 'string' ? err : err?.message || 'فشل تحديث بيانات المريض');
      }
      return res.data;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.patients.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.patients.detail(id) });

      const previousPatientsQueries = queryClient.getQueriesData<Paginated<Patient>>({
        queryKey: queryKeys.patients.all,
      });
      const previousDetail = queryClient.getQueryData<Patient>(queryKeys.patients.detail(id));

      // Optimistically update list
      queryClient.setQueriesData<Paginated<Patient>>(
        { queryKey: queryKeys.patients.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => (item.id === id ? { ...item, ...data, updated_at: new Date().toISOString() } : item)),
          };
        }
      );

      // Optimistically update detail
      if (previousDetail) {
        queryClient.setQueryData<Patient>(queryKeys.patients.detail(id), {
          ...previousDetail,
          ...data,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousPatientsQueries, previousDetail };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousPatientsQueries) {
        for (const [queryKey, data] of context.previousPatientsQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.patients.detail(id), context.previousDetail);
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todaySummary });
      queryClient.invalidateQueries({ queryKey: ['patients', 'duplicate-check'] });
    },
  });
}

// Mutation: Delete / Archive Patient with Optimistic Update
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patients.delete(id);
      if (!res.ok) {
        const err = res.error as any;
        throw new Error(typeof err === 'string' ? err : err?.message || 'فشل حذف المريض');
      }
      return res.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.patients.all });

      const previousPatientsQueries = queryClient.getQueriesData<Paginated<Patient>>({
        queryKey: queryKeys.patients.all,
      });

      queryClient.setQueriesData<Paginated<Patient>>(
        { queryKey: queryKeys.patients.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            total: Math.max(0, old.total - 1),
            items: old.items.filter((item) => item.id !== id),
          };
        }
      );

      return { previousPatientsQueries };
    },
    onError: (_err, _id, context) => {
      if (context?.previousPatientsQueries) {
        for (const [queryKey, data] of context.previousPatientsQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todaySummary });
      queryClient.invalidateQueries({ queryKey: ['patients', 'duplicate-check'] });
      queryClient.invalidateQueries({ queryKey: ['patients', 'code-generation'] });
    },
  });
}

// Mutation: Save Medical History
export function useSaveMedicalHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateMedicalHistory) => {
      const res = await api.patients.saveMedicalHistory(payload);
      if (!res.ok) {
        const err = res.error as any;
        throw new Error(typeof err === 'string' ? err : err?.message || 'فشل حفظ السجل الطبي');
      }
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.medicalHistory(variables.patient_id) });
    },
  });
}

// Mutation: Save Allergy
export function useSaveAllergy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateAllergy) => {
      const res = await api.patients.saveAllergy(payload);
      if (!res.ok) {
        const err = res.error as any;
        throw new Error(typeof err === 'string' ? err : err?.message || 'فشل حفظ الحساسية');
      }
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.allergies(variables.patient_id) });
    },
  });
}
