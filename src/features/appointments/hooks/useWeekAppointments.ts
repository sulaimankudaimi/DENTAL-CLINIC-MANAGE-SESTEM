import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { Appointment } from '@shared/contracts';
import { getWorkingWeekDays, DayInfo } from '../lib/slots';

interface UseWeekAppointmentsProps {
  selectedDate: Date;
  selectedDentist?: string;
  selectedRoom?: string;
  selectedStatus?: string;
}

export function useWeekAppointments({
  selectedDate,
  selectedDentist = 'all',
  selectedRoom = 'all',
  selectedStatus = 'all',
}: UseWeekAppointmentsProps) {
  const weekDays: DayInfo[] = useMemo(() => {
    return getWorkingWeekDays(selectedDate);
  }, [selectedDate]);

  const startDateStr = weekDays[0]?.dateStr || '';
  const endDateStr = weekDays[weekDays.length - 1]?.dateStr || '';

  const dateFrom = `${startDateStr}T00:00:00.000Z`;
  const dateTo = `${endDateStr}T23:59:59.999Z`;

  const { data: rawAppointments = [], isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.appointments.list({
      dateFrom,
      dateTo,
      dentist: selectedDentist,
      room: selectedRoom,
      status: selectedStatus,
    }),
    queryFn: async () => {
      const res = await api.appointments.list({
        date_from: dateFrom,
        date_to: dateTo,
        dentist_id: selectedDentist !== 'all' ? selectedDentist : undefined,
        status: selectedStatus !== 'all' ? (selectedStatus as Appointment['status']) : undefined,
        page: 1,
        limit: 300,
        sort_order: 'asc',
      });
      return res.ok ? res.data.items : [];
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  // Filter in memory for room and status if not covered by API
  const filteredAppointments = useMemo(() => {
    return rawAppointments.filter((appt) => {
      if (selectedDentist !== 'all' && appt.dentist_id !== selectedDentist) return false;
      if (selectedRoom !== 'all' && appt.room_id !== selectedRoom) return false;
      if (selectedStatus !== 'all' && appt.status !== selectedStatus) return false;
      return true;
    });
  }, [rawAppointments, selectedDentist, selectedRoom, selectedStatus]);

  // Index appointments by day YYYY-MM-DD
  const appointmentsByDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    weekDays.forEach((d) => {
      map[d.dateStr] = [];
    });

    filteredAppointments.forEach((appt) => {
      const day = appt.start_at.substring(0, 10);
      if (map[day]) {
        map[day].push(appt);
      } else {
        map[day] = [appt];
      }
    });

    // Sort appointments in each day by start time
    Object.keys(map).forEach((dayKey) => {
      map[dayKey].sort((a, b) => a.start_at.localeCompare(b.start_at));
    });

    return map;
  }, [filteredAppointments, weekDays]);

  // Statistics for header & team status bar
  const stats = useMemo(() => {
    const total = filteredAppointments.length;
    const unconfirmed = filteredAppointments.filter(
      (a) => a.status === 'waiting' || a.status === 'scheduled'
    ).length;
    const confirmed = filteredAppointments.filter((a) => a.status === 'confirmed').length;
    const completed = filteredAppointments.filter((a) => a.status === 'completed').length;
    const cancelled = filteredAppointments.filter((a) => a.status === 'cancelled').length;

    return {
      total,
      unconfirmed,
      confirmed,
      completed,
      cancelled,
    };
  }, [filteredAppointments]);

  return {
    weekDays,
    startDateStr,
    endDateStr,
    appointments: filteredAppointments,
    allAppointments: rawAppointments,
    appointmentsByDay,
    stats,
    isLoading,
    error,
    refetch,
  };
}
