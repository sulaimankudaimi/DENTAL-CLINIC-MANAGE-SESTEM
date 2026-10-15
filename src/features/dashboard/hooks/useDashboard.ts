import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type {
  Appointment,
  AppointmentStatus,
  Patient,
  User,
  Procedure,
  DashboardSummary,
  CreateAppointment,
  CreatePatient,
} from '@shared/contracts';

export function useDashboard() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // ISO date string (YYYY-MM-DD) for selected day
  const selectedDateStr = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  // ISO date string for today
  const todayStr = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 1. Dashboard Today Summary KPI
  const {
    data: summary,
    isLoading: isLoadingSummary,
    isError: isErrorSummary,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery<DashboardSummary | null>({
    queryKey: queryKeys.dashboard.todaySummary,
    queryFn: async () => {
      const res = await api.dashboard.getTodaySummary();
      if (!res.ok) {
        throw new Error(res.error || 'تعذر تحميل ملخص لوحة التحكم');
      }
      return res.data;
    },
    refetchInterval: 30000,
  });

  // 2. Appointments for Selected Date
  const {
    data: appointments = [],
    isLoading: isLoadingAppointments,
    isError: isErrorAppointments,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = useQuery<Appointment[]>({
    queryKey: ['dashboard', 'appointments', selectedDateStr],
    queryFn: async () => {
      // If it's today, try getToday() or list with date boundaries
      if (selectedDateStr === todayStr) {
        const todayRes = await api.appointments.getToday();
        if (todayRes.ok && todayRes.data.length > 0) {
          return todayRes.data;
        }
      }

      const res = await api.appointments.list({
        date_from: `${selectedDateStr}T00:00:00.000Z`,
        date_to: `${selectedDateStr}T23:59:59.999Z`,
        page: 1,
        limit: 100,
        sort_order: 'asc',
      });

      if (!res.ok) {
        throw new Error(res.error || 'تعذر تحميل مواعيد اليوم المحدد');
      }

      // Sort by start_at ascending
      return [...res.data.items].sort((a, b) => a.start_at.localeCompare(b.start_at));
    },
  });

  // 3. Month Appointments for MiniCalendar dot indicators
  const currentMonthPrefix = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, [selectedDate]);

  const { data: monthAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ['dashboard', 'appointments', 'month', currentMonthPrefix],
    queryFn: async () => {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const fromStr = `${firstDay.toISOString().split('T')[0]}T00:00:00.000Z`;
      const toStr = `${lastDay.toISOString().split('T')[0]}T23:59:59.999Z`;

      const res = await api.appointments.list({
        date_from: fromStr,
        date_to: toStr,
        page: 1,
        limit: 200,
        sort_order: 'asc',
      });

      return res.ok ? res.data.items : [];
    },
  });

  // Days in month that have appointments
  const appointmentDaysInMonth = useMemo(() => {
    const daysSet = new Set<number>();
    monthAppointments.forEach((appt) => {
      if (appt.start_at && !appt.deleted_at && appt.status !== 'cancelled') {
        const d = new Date(appt.start_at);
        daysSet.add(d.getDate());
      }
    });
    return daysSet;
  }, [monthAppointments]);

  // 4. Patients Lookup & Recent Patients
  const {
    data: patients = [],
    isLoading: isLoadingPatients,
    isError: isErrorPatients,
    refetch: refetchPatients,
  } = useQuery<Patient[]>({
    queryKey: queryKeys.patients.all,
    queryFn: async () => {
      const res = await api.patients.list({ page: 1, limit: 100, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
  });

  // Recent patients sorted by creation date
  const recentPatients = useMemo(() => {
    return [...patients]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 10);
  }, [patients]);

  // 5. Staff Lookup
  const { data: staffList = [] } = useQuery<User[]>({
    queryKey: queryKeys.staff.all,
    queryFn: async () => {
      const res = await api.staff.list();
      return res.ok ? res.data.items : [];
    },
  });

  // 6. Procedures Lookup
  const { data: procedures = [] } = useQuery<Procedure[]>({
    queryKey: ['procedures', 'all'],
    queryFn: async () => {
      const res = await api.treatments.getProcedures({ page: 1, limit: 100, sort_order: 'asc' });
      return res.ok ? res.data.items : [];
    },
  });

  // Helper getters
  const getPatient = (patientId: string): Patient | undefined => {
    return patients.find((p) => p.id === patientId);
  };

  const getDentist = (dentistId: string): User | undefined => {
    return staffList.find((s) => s.id === dentistId);
  };

  const getProcedureName = (procedureIds: string[]): string => {
    if (!procedureIds || procedureIds.length === 0) return 'فحص ومعاينة';
    const names = procedureIds
      .map((id) => procedures.find((pr) => pr.id === id)?.name_ar)
      .filter(Boolean);
    return names.length > 0 ? names.join('، ') : 'كشف واستشارة طبية';
  };

  // Mutations
  const updateAppointmentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const res = await api.appointments.updateStatus(id, status);
      if (!res.ok) throw new Error(res.error || 'فشل تحديث حالة الموعد');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todaySummary });
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (payload: CreateAppointment) => {
      const res = await api.appointments.create(payload);
      if (!res.ok) throw new Error(res.error || 'فشل إضافة الموعد');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todaySummary });
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async (payload: CreatePatient) => {
      const res = await api.patients.create(payload);
      if (!res.ok) throw new Error(res.error || 'فشل تسجيل المريض');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todaySummary });
    },
  });

  return {
    selectedDate,
    setSelectedDate,
    selectedDateStr,
    todayStr,
    isTodaySelected: selectedDateStr === todayStr,
    summary,
    isLoadingSummary,
    isErrorSummary,
    summaryError,
    refetchSummary,
    appointments,
    isLoadingAppointments,
    isErrorAppointments,
    appointmentsError,
    refetchAppointments,
    appointmentDaysInMonth,
    recentPatients,
    isLoadingPatients,
    isErrorPatients,
    refetchPatients,
    getPatient,
    getDentist,
    getProcedureName,
    updateAppointmentStatus: updateAppointmentStatusMutation.mutateAsync,
    isUpdatingStatus: updateAppointmentStatusMutation.isPending,
    createAppointment: createAppointmentMutation.mutateAsync,
    isCreatingAppointment: createAppointmentMutation.isPending,
    createPatient: createPatientMutation.mutateAsync,
    isCreatingPatient: createPatientMutation.isPending,
  };
}
