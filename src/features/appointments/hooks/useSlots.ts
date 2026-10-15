import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { getCalendarConfig, formatArabicTime } from '../lib/slots';
import { checkAppointmentConflict } from '../lib/conflicts';

interface UseSlotsProps {
  dateStr: string; // YYYY-MM-DD
  dentistId?: string;
  roomId?: string;
  durationMinutes?: number;
  excludeAppointmentId?: string;
}

export function useSlots({
  dateStr,
  dentistId,
  roomId,
  durationMinutes,
  excludeAppointmentId,
}: UseSlotsProps) {
  const calConfig = getCalendarConfig();
  const effectiveDuration = durationMinutes || calConfig.slotDurationMinutes || 30;
  const dateFrom = `${dateStr}T00:00:00.000Z`;
  const dateTo = `${dateStr}T23:59:59.999Z`;

  const { data: dayAppointments = [], isLoading } = useQuery({
    queryKey: queryKeys.appointments.list({ dateFrom, dateTo, daySlotCheck: true }),
    queryFn: async () => {
      if (!dateStr) return [];
      const res = await api.appointments.list({
        date_from: dateFrom,
        date_to: dateTo,
        page: 1,
        limit: 100,
        sort_order: 'asc',
      });
      return res.ok ? res.data.items : [];
    },
    enabled: !!dateStr,
  });

  const slots = useMemo(() => {
    if (!dateStr) return [];
    const result: Array<{
      startAt: string;
      endAt: string;
      label: string;
      hour: number;
      minute: number;
      isAvailable: boolean;
      conflictMessage?: string;
    }> = [];

    const config = getCalendarConfig();
    const effectiveStartHour = config.startHour;
    const effectiveEndHour = config.endHour;
    const stepMinutes = config.slotDurationMinutes || 30;

    for (let h = effectiveStartHour; h < effectiveEndHour; h++) {
      for (let m = 0; m < 60; m += stepMinutes) {
        const slotStart = new Date(`${dateStr}T00:00:00`);
        slotStart.setHours(h, m, 0, 0);

        const slotEnd = new Date(slotStart.getTime() + effectiveDuration * 60000);
        if (slotEnd.getHours() > effectiveEndHour || (slotEnd.getHours() === effectiveEndHour && slotEnd.getMinutes() > 0)) {
          continue;
        }

        const startAt = slotStart.toISOString();
        const endAt = slotEnd.toISOString();

        let isAvailable = true;
        let conflictMessage: string | undefined;

        if (dentistId) {
          const conflict = checkAppointmentConflict({
            appointmentId: excludeAppointmentId,
            dentistId,
            roomId: roomId || null,
            startAt,
            endAt,
            existingAppointments: dayAppointments,
          });

          if (conflict.hasConflict) {
            isAvailable = false;
            conflictMessage = conflict.message;
          }
        }

        result.push({
          startAt,
          endAt,
          label: formatArabicTime(h, m),
          hour: h,
          minute: m,
          isAvailable,
          conflictMessage,
        });
      }
    }

    return result;
  }, [dateStr, dentistId, roomId, durationMinutes, excludeAppointmentId, dayAppointments]);

  return {
    slots,
    isLoading,
    dayAppointments,
  };
}
