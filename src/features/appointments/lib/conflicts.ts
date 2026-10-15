import { Appointment, User, Room, Patient } from '@shared/contracts';
import { formatIsoArabicTime, getCalendarConfig } from './slots';

export interface ConflictCheckParams {
  appointmentId?: string;
  dentistId: string;
  roomId?: string | null;
  startAt: string;
  endAt: string;
  existingAppointments: Appointment[];
  dentists?: User[];
  rooms?: Room[];
  patients?: Patient[];
}

export interface ConflictResult {
  hasConflict: boolean;
  type?: 'dentist' | 'room' | 'invalid_time';
  message?: string;
  conflictingAppointment?: Appointment;
}

/**
 * Checks for overlapping appointment conflicts:
 * 1. Invalid time: start >= end
 * 2. Doctor conflict: Same dentist has an active appointment in the overlapping window
 * 3. Room conflict: Same room has an active appointment in the overlapping window
 */
export function checkAppointmentConflict(params: ConflictCheckParams): ConflictResult {
  const {
    appointmentId,
    dentistId,
    roomId,
    startAt,
    endAt,
    existingAppointments,
    dentists = [],
    rooms = [],
    patients = [],
  } = params;

  const newStart = new Date(startAt).getTime();
  const newEnd = new Date(endAt).getTime();

  if (newStart >= newEnd) {
    return {
      hasConflict: true,
      type: 'invalid_time',
      message: 'وقت بداية الموعد يجب أن يكون قبل وقت النهاية',
    };
  }

  for (const existing of existingAppointments) {
    // Skip self or deleted/cancelled appointments
    if (existing.id === appointmentId) continue;
    if (existing.deleted_at || existing.status === 'cancelled') continue;

    const existStart = new Date(existing.start_at).getTime();
    const existEnd = new Date(existing.end_at).getTime();

    // Check time overlap: (StartA < EndB) and (EndA > StartB)
    const isOverlapping = newStart < existEnd && newEnd > existStart;
    if (!isOverlapping) continue;

    // 1. Doctor Conflict Check
    if (existing.dentist_id === dentistId) {
      const doctor = dentists.find((d) => d.id === dentistId);
      const doctorName = doctor ? doctor.full_name : 'الطبيب';
      const patient = patients.find((p) => p.id === existing.patient_id);
      const patientName = patient ? `${patient.first_name} ${patient.family_name}` : 'مريض آخر';

      const timeRange = `${formatIsoArabicTime(existing.start_at)} - ${formatIsoArabicTime(existing.end_at)}`;

      return {
        hasConflict: true,
        type: 'dentist',
        message: `تعارض في المواعيد: ${doctorName} لديه موعد مسجل في هذا التوقيت (${timeRange}) مع ${patientName}`,
        conflictingAppointment: existing,
      };
    }

    // 2. Room Conflict Check
    if (roomId && existing.room_id && existing.room_id === roomId) {
      const room = rooms.find((r) => r.id === roomId);
      const roomName = room ? room.name : 'الغرفة المحددة';
      const timeRange = `${formatIsoArabicTime(existing.start_at)} - ${formatIsoArabicTime(existing.end_at)}`;

      return {
        hasConflict: true,
        type: 'room',
        message: `تعارض في القاعات: ${roomName} محجوزة بالفعل في هذا التوقيت (${timeRange})`,
        conflictingAppointment: existing,
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Finds the next available non-conflicting slot for a given date, dentist, room and duration
 */
export function findNextAvailableSlot(
  dateStr: string,
  dentistId: string,
  roomId: string | null,
  durationMinutes?: number,
  existingAppointments: Appointment[] = [],
  startHour?: number,
  endHour?: number
): { startAt: string; endAt: string } | null {
  const config = getCalendarConfig();
  const effectiveStart = startHour ?? config.startHour;
  const effectiveEnd = endHour ?? config.endHour;
  const effectiveDuration = durationMinutes ?? config.slotDurationMinutes;
  const stepMinutes = 15;

  for (let h = effectiveStart; h < effectiveEnd; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      const slotStart = new Date(`${dateStr}T00:00:00`);
      slotStart.setHours(h, m, 0, 0);

      const slotEnd = new Date(slotStart.getTime() + effectiveDuration * 60000);
      if (slotEnd.getHours() > effectiveEnd || (slotEnd.getHours() === effectiveEnd && slotEnd.getMinutes() > 0)) {
        continue;
      }

      const conflict = checkAppointmentConflict({
        dentistId,
        roomId,
        startAt: slotStart.toISOString(),
        endAt: slotEnd.toISOString(),
        existingAppointments,
      });

      if (!conflict.hasConflict) {
        return {
          startAt: slotStart.toISOString(),
          endAt: slotEnd.toISOString(),
        };
      }
    }
  }

  return null;
}
