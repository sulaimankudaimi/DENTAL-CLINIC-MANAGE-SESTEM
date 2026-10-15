export interface DayInfo {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNameAr: string; // السبت، الأحد، ...
  dayNumber: number; // 14
  monthNameAr: string; // أكتوبر
  fullFormattedAr: string; // السبت، 14 أكتوبر
  dutyDoctorName: string; // الطبيب المناوب
  dutyDoctorId?: string;
  isToday: boolean;
}

export const CALENDAR_START_HOUR = 8; // 8:00 AM
export const CALENDAR_END_HOUR = 20; // 8:00 PM
export const DEFAULT_SLOT_MINUTES = 30;
export const HOUR_HEIGHT = 64; // pixels per hour (32px per 30m slot)

export function getCalendarConfig(): {
  startHour: number;
  endHour: number;
  slotDurationMinutes: number;
} {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('clinic_working_hours') : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      let minHour = 24;
      let maxHour = 0;
      if (parsed.schedule && Array.isArray(parsed.schedule)) {
        for (const day of parsed.schedule) {
          if (!day.is_open || !day.shifts) continue;
          for (const s of day.shifts) {
            if (s.start_time) {
              const h = parseInt(s.start_time.split(':')[0], 10);
              if (!isNaN(h)) minHour = Math.min(minHour, h);
            }
            if (s.end_time) {
              const h = Math.ceil(parseInt(s.end_time.split(':')[0], 10) + parseInt(s.end_time.split(':')[1] || '0', 10) / 60);
              if (!isNaN(h)) maxHour = Math.max(maxHour, h);
            }
          }
        }
      }
      return {
        startHour: minHour < 24 ? minHour : CALENDAR_START_HOUR,
        endHour: maxHour > 0 ? maxHour : CALENDAR_END_HOUR,
        slotDurationMinutes: parsed.default_slot_duration_min || DEFAULT_SLOT_MINUTES,
      };
    }
  } catch {}

  return {
    startHour: CALENDAR_START_HOUR,
    endHour: CALENDAR_END_HOUR,
    slotDurationMinutes: DEFAULT_SLOT_MINUTES,
  };
}

export const ARABIC_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

/**
 * Formats hour/minute into Arabic 12-hour format:
 * e.g. 8:00 -> "8:00ص", 13:00 -> "1:00م", 12:00 -> "12:00م"
 */
export function formatArabicTime(hour: number, minute = 0): string {
  const period = hour >= 12 ? 'م' : 'ص';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMin = minute === 0 ? '00' : minute < 10 ? `0${minute}` : `${minute}`;
  return `${displayHour}:${displayMin}${period}`;
}

/**
 * Formats ISO date string to Arabic time
 */
export function formatIsoArabicTime(isoStr: string): string {
  const date = new Date(isoStr);
  return formatArabicTime(date.getHours(), date.getMinutes());
}

/**
 * Generates array of hourly time slots from start to end hour
 */
export function getTimeSlots(startHour = CALENDAR_START_HOUR, endHour = CALENDAR_END_HOUR): Array<{ hour: number; label: string }> {
  const slots: Array<{ hour: number; label: string }> = [];
  for (let h = startHour; h <= endHour; h++) {
    slots.push({
      hour: h,
      label: formatArabicTime(h, 0),
    });
  }
  return slots;
}

/**
 * Given a base date, returns the week starting Saturday (index 6) to Thursday (or Friday)
 */
export function getWorkingWeekDays(baseDate: Date, includeFriday = false): DayInfo[] {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);

  // Day of week: 0 = Sun, 1 = Mon, ..., 6 = Sat
  const dayOfWeek = d.getDay();
  // Saturday offset: if day is Sat(6), diff is 0; Sun(0) -> diff is -1; Mon(1) -> diff is -2
  const diffToSaturday = dayOfWeek === 6 ? 0 : -(dayOfWeek + 1);

  const saturday = new Date(d);
  saturday.setDate(d.getDate() + diffToSaturday);

  const todayStr = new Date().toISOString().split('T')[0];
  const count = includeFriday ? 7 : 6; // Sat to Thu = 6 days, or 7 with Fri
  const days: DayInfo[] = [];

  for (let i = 0; i < count; i++) {
    const cur = new Date(saturday);
    cur.setDate(saturday.getDate() + i);

    const year = cur.getFullYear();
    const month = String(cur.getMonth() + 1).padStart(2, '0');
    const dayNum = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayNum}`;

    const dayIdx = cur.getDay(); // 6=Sat, 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
    const dayNameAr = ARABIC_DAYS[dayIdx];
    const monthNameAr = ARABIC_MONTHS[cur.getMonth()];

    // Schedule duty doctors matching clinic plan:
    // Sat & Mon & Sun -> Dr. Ahmed Khaled
    // Tue, Wed, Thu -> Dr. Sara Hassan
    let dutyDoctorName = 'د. أحمد خالد';
    let dutyDoctorId = 'u1000000-0000-0000-0000-000000000001';

    if (dayIdx === 2 || dayIdx === 3 || dayIdx === 4) {
      // Tue, Wed, Thu
      dutyDoctorName = 'د. سارة حسن';
      dutyDoctorId = 'u1000000-0000-0000-0000-000000000005';
    }

    days.push({
      date: cur,
      dateStr,
      dayNameAr,
      dayNumber: cur.getDate(),
      monthNameAr,
      fullFormattedAr: `${dayNameAr}، ${cur.getDate()} ${monthNameAr}`,
      dutyDoctorName,
      dutyDoctorId,
      isToday: dateStr === todayStr,
    });
  }

  return days;
}

/**
 * Calculates top offset and height in pixels for an appointment block
 */
export function getAppointmentPosition(
  startAt: string,
  endAt: string,
  calendarStartHour = CALENDAR_START_HOUR,
  hourHeight = HOUR_HEIGHT
): { top: number; height: number } {
  const start = new Date(startAt);
  const end = new Date(endAt);

  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;

  const top = Math.max(0, (startHour - calendarStartHour) * hourHeight);
  const rawHeight = Math.max(0.25, endHour - startHour) * hourHeight;
  const height = Math.max(rawHeight, 26); // Ensure minimum visible height

  return { top, height };
}

/**
 * Calculates current time line top offset in pixels if date is today
 */
export function getCurrentTimeTop(
  calendarStartHour = CALENDAR_START_HOUR,
  calendarEndHour = CALENDAR_END_HOUR,
  hourHeight = HOUR_HEIGHT
): number | null {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  if (currentHour < calendarStartHour || currentHour > calendarEndHour) {
    return null;
  }

  return (currentHour - calendarStartHour) * hourHeight;
}

/**
 * Converts a pixel click on a day column to an ISO start and end timestamp
 */
export function pixelOffsetToTime(
  dateStr: string,
  yOffsetPx: number,
  durationMinutes = 30,
  calendarStartHour = CALENDAR_START_HOUR,
  hourHeight = HOUR_HEIGHT,
  snapMinutes = 15
): { startAt: string; endAt: string } {
  const hoursFraction = yOffsetPx / hourHeight;
  const totalMinutes = Math.round((calendarStartHour + hoursFraction) * 60);

  // Snap to nearest interval (15 min)
  const snappedMinutes = Math.round(totalMinutes / snapMinutes) * snapMinutes;
  const finalHour = Math.floor(snappedMinutes / 60);
  const finalMinute = snappedMinutes % 60;

  const date = new Date(`${dateStr}T00:00:00`);
  date.setHours(finalHour, finalMinute, 0, 0);

  const startAt = date.toISOString();
  const endDate = new Date(date.getTime() + durationMinutes * 60000);
  const endAt = endDate.toISOString();

  return { startAt, endAt };
}
