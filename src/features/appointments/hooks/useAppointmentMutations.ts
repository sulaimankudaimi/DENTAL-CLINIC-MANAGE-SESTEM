import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import {
  CreateAppointment,
  UpdateAppointment,
  AppointmentStatus,
  Appointment,
  User,
  Room,
  Patient,
} from '@shared/contracts';
import { checkAppointmentConflict } from '../lib/conflicts';

interface MutationDeps {
  allAppointments?: Appointment[];
  dentists?: User[];
  rooms?: Room[];
  patients?: Patient[];
  onConflict?: (message: string) => void;
  onSuccessMessage?: (message: string) => void;
}

export function useAppointmentMutations(deps: MutationDeps = {}) {
  const queryClient = useQueryClient();
  const { allAppointments = [], dentists = [], rooms = [], patients = [], onConflict, onSuccessMessage } = deps;

  const invalidateCalendar = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.todaySummary });
  };

  // 1. Create Appointment
  const createMutation = useMutation({
    mutationFn: async (payload: CreateAppointment) => {
      // Validate conflicts
      const conflict = checkAppointmentConflict({
        dentistId: payload.dentist_id,
        roomId: payload.room_id,
        startAt: payload.start_at,
        endAt: payload.end_at,
        existingAppointments: allAppointments,
        dentists,
        rooms,
        patients,
      });

      if (conflict.hasConflict) {
        onConflict?.(conflict.message || 'يوجد تعارض في الموعد المحدد');
        throw new Error(conflict.message);
      }

      const res = await api.appointments.create(payload);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      invalidateCalendar();
      onSuccessMessage?.('تم حجز الموعد بنجاح');
    },
  });

  // 2. Update Appointment (with optimistic drag-and-drop & resize support)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAppointment }) => {
      // If time or doctor or room changed, validate conflict
      if (data.start_at && data.end_at && data.dentist_id) {
        const conflict = checkAppointmentConflict({
          appointmentId: id,
          dentistId: data.dentist_id,
          roomId: data.room_id,
          startAt: data.start_at,
          endAt: data.end_at,
          existingAppointments: allAppointments,
          dentists,
          rooms,
          patients,
        });

        if (conflict.hasConflict) {
          onConflict?.(conflict.message || 'يوجد تعارض في الموعد المحدد');
          throw new Error(conflict.message);
        }
      }

      const res = await api.appointments.update(id, data);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      invalidateCalendar();
      onSuccessMessage?.('تم تحديث الموعد بنجاح');
    },
  });

  // 3. Update Status
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const res = await api.appointments.updateStatus(id, status);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      invalidateCalendar();
      onSuccessMessage?.('تم تحديث حالة الموعد');
    },
  });

  // 4. Delete Appointment
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.appointments.delete(id);
      if (!res.ok) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      invalidateCalendar();
      onSuccessMessage?.('تم إلغاء الموعد بنجاح');
    },
  });

  return {
    createAppointment: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    updateAppointment: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    updateStatus: statusMutation.mutateAsync,
    isUpdatingStatus: statusMutation.isPending,

    deleteAppointment: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
