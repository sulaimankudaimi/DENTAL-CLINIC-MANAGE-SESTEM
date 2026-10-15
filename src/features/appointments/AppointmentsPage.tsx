import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import {
  Appointment,
  CreateAppointment,
  UpdateAppointment,
} from '@shared/contracts';
import { useWeekAppointments } from './hooks/useWeekAppointments';
import { useAppointmentMutations } from './hooks/useAppointmentMutations';
import { RoomsStatusBar } from './components/RoomsStatusBar';
import { WeekCalendar } from './components/WeekCalendar';
import { UpcomingEvents } from './components/UpcomingEvents';
import { TeamMessages } from './components/TeamMessages';
import { AppointmentFormDialog } from './components/AppointmentFormDialog';
import { WaitingList } from './components/WaitingList';
import {
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const AppointmentsPage: React.FC = () => {
  // Calendar date state: initialize to current date
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedDentist, setSelectedDentist] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [isWaitingListOpen, setIsWaitingListOpen] = useState(false);

  // Form pre-fill coordinates
  const [formDefaultDate, setFormDefaultDate] = useState<string>('');
  const [formDefaultStart, setFormDefaultStart] = useState<string>('');
  const [formDefaultEnd, setFormDefaultEnd] = useState<string>('');
  const [formDefaultDoctor, setFormDefaultDoctor] = useState<string>('');

  // Notification banners / toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [conflictAlert, setConflictAlert] = useState<string | null>(null);

  // 1. Fetch Dentists / Staff
  const { data: dentists = [] } = useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: async () => {
      const res = await api.staff.list({ page: 1, limit: 50, sort_order: 'desc' });
      return res.ok ? res.data.items.filter((u) => u.role === 'dentist' || u.role === 'owner') : [];
    },
  });

  // 2. Fetch Patients
  const { data: patients = [], refetch: refetchPatients } = useQuery({
    queryKey: queryKeys.patients.all,
    queryFn: async () => {
      const res = await api.patients.list({ page: 1, limit: 100, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
  });

  // 3. Fetch Rooms
  const { data: rooms = [] } = useQuery({
    queryKey: queryKeys.rooms.all,
    queryFn: async () => {
      const res = await api.rooms.list();
      return res.ok ? res.data : [];
    },
  });

  // 4. Fetch Procedures
  const { data: procedures = [] } = useQuery({
    queryKey: queryKeys.treatments.procedures(),
    queryFn: async () => {
      const res = await api.treatments.getProcedures({ page: 1, limit: 100, sort_order: 'desc' });
      return res.ok ? res.data.items : [];
    },
  });

  // Maps for fast lookups
  const patientsMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);
  const dentistsMap = useMemo(() => new Map(dentists.map((d) => [d.id, d])), [dentists]);
  const roomsMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
  const proceduresMap = useMemo(() => new Map(procedures.map((p) => [p.id, p])), [procedures]);

  // 5. Week Appointments Hook
  const {
    weekDays,
    appointments,
    allAppointments,
    appointmentsByDay,
    stats,
    refetch: refetchAppointments,
  } = useWeekAppointments({
    selectedDate,
    selectedDentist,
    selectedRoom,
    selectedStatus,
  });

  // 6. Appointment Mutations
  const {
    createAppointment,
    updateAppointment,
    updateStatus,
  } = useAppointmentMutations({
    allAppointments,
    dentists,
    rooms,
    patients,
    onConflict: (msg) => {
      setConflictAlert(msg);
      setTimeout(() => setConflictAlert(null), 5000);
    },
    onSuccessMessage: (msg) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  // Seed sample week appointments matching screenshot if appointments in this week are empty
  useEffect(() => {
    if (weekDays.length === 0 || patients.length === 0 || dentists.length === 0 || procedures.length === 0) {
      return;
    }

    const currentTotal = appointments.length;
    if (currentTotal > 0) return;

    // Build the screenshot appointments
    const drAhmed = dentists[0]?.id || 'u1000000-0000-0000-0000-000000000001';
    const drSara = dentists.find((d) => d.full_name.includes('سارة'))?.id || dentists[1]?.id || drAhmed;

    const room1 = rooms[0]?.id || 'r1000000-0000-0000-0000-000000000001';
    const room2 = rooms[1]?.id || 'r1000000-0000-0000-0000-000000000002';
    const room3 = rooms[2]?.id || 'r1000000-0000-0000-0000-000000000003';

    // Find patients with names close to screenshot: محمد علي, سارة محمد, خالد حسن, فاطمة علي
    const pMohamed = patients.find((p) => p.first_name.includes('محمد') || p.first_name.includes('أحمد')) || patients[0];
    const pSara = patients.find((p) => p.first_name.includes('سارة') || p.first_name.includes('نورة')) || patients[1];
    const pKhaled = patients.find((p) => p.first_name.includes('خالد') || p.first_name.includes('عبد الله')) || patients[2];
    const pFatima = patients.find((p) => p.first_name.includes('فاطمة') || p.first_name.includes('مريم')) || patients[3];

    // Find procedures: filling (حشو), exam (كشف), root canal (علاج عصب)
    const procFilling = procedures.find((p) => p.name_ar?.includes('حشو') || p.name_en?.includes('Composite')) || procedures[0];
    const procExam = procedures.find((p) => p.name_ar?.includes('كشف') || p.name_en?.includes('Exam')) || procedures[1];
    const procEndo = procedures.find((p) => p.name_ar?.includes('عصب') || p.name_en?.includes('Root')) || procedures[2];

    const samples: CreateAppointment[] = [];
    const addSample = (
      patientId: string,
      dentistId: string,
      roomId: string,
      startAt: string,
      endAt: string,
      procedureIds: string[],
      status: Appointment['status'],
      source: Appointment['source'] = 'walk_in'
    ) => {
      samples.push({
        clinic_id: 'c1000000-0000-0000-0000-000000000001',
        branch_id: 'b1000000-0000-0000-0000-000000000001',
        patient_id: patientId,
        dentist_id: dentistId,
        room_id: roomId,
        start_at: startAt,
        end_at: endAt,
        procedure_ids: procedureIds,
        status,
        source,
        notes: null,
        color_override: null,
        created_by: dentistId,
      });
    };

    weekDays.forEach((day, dayIdx) => {
      const dayDate = day.dateStr;
      const isSat = dayIdx === 0;
      const isMon = dayIdx === 2;
      const isTue = dayIdx === 3;
      const isWed = dayIdx === 4;
      const isThu = dayIdx === 5;

      const makeTime = (hour: number, min = 0, dur = 30) => {
        const d = new Date(`${dayDate}T00:00:00`);
        d.setHours(hour, min, 0, 0);
        const start = d.toISOString();
        const end = new Date(d.getTime() + dur * 60000).toISOString();
        return { start, end };
      };

      if (isSat) {
        // Saturday:
        // 8:00ص: محمد علي - حشو - مؤكد
        const t1 = makeTime(8, 0, 45);
        addSample(pMohamed.id, drAhmed, room1, t1.start, t1.end, [procFilling.id], 'confirmed');

        // 10:00ص: سارة محمد - كشف - في الانتظار
        const t2 = makeTime(10, 0, 30);
        addSample(pSara.id, drAhmed, room2, t2.start, t2.end, [procExam.id], 'waiting', 'phone');

        // 12:00م: خالد حسن - حشو - مؤكد
        const t3 = makeTime(12, 0, 45);
        addSample(pKhaled.id, drAhmed, room1, t3.start, t3.end, [procFilling.id], 'confirmed');

        // 2:00م: فاطمة علي - حشو - مؤكد
        const t4 = makeTime(14, 0, 45);
        addSample(pFatima.id, drAhmed, room3, t4.start, t4.end, [procFilling.id], 'confirmed');
      } else if (isMon) {
        // Monday:
        // 10:00ص: سارة محمد - كشف - في الانتظار
        const t1 = makeTime(10, 0, 30);
        addSample(pSara.id, drAhmed, room2, t1.start, t1.end, [procExam.id], 'waiting', 'phone');

        // 1:00م: خالد حسن - علاج عصب - ملغى
        const t2 = makeTime(13, 0, 45);
        addSample(pKhaled.id, drAhmed, room3, t2.start, t2.end, [procEndo.id], 'cancelled');

        // 2:00م: فاطمة علي - حشو - مؤكد
        const t3 = makeTime(14, 0, 45);
        addSample(pFatima.id, drAhmed, room1, t3.start, t3.end, [procFilling.id], 'confirmed');
      } else if (isTue) {
        // Tuesday:
        // 12:00م: محمد علي - حشو - مؤكد
        const t1 = makeTime(12, 0, 45);
        addSample(pMohamed.id, drSara, room2, t1.start, t1.end, [procFilling.id], 'confirmed');

        // 2:00م: سارة محمد - كشف - في الانتظار
        const t2 = makeTime(14, 0, 30);
        addSample(pSara.id, drSara, room1, t2.start, t2.end, [procExam.id], 'waiting', 'phone');

        // 4:00م: خالد حسن - حشو - مؤكد
        const t3 = makeTime(16, 0, 45);
        addSample(pKhaled.id, drSara, room3, t3.start, t3.end, [procFilling.id], 'confirmed');
      } else if (isWed) {
        // Wednesday:
        const t1 = makeTime(8, 0, 45);
        addSample(pMohamed.id, drSara, room1, t1.start, t1.end, [procFilling.id], 'confirmed');

        const t2 = makeTime(10, 0, 30);
        addSample(pSara.id, drSara, room2, t2.start, t2.end, [procExam.id], 'waiting', 'phone');

        const t3 = makeTime(12, 0, 45);
        addSample(pFatima.id, drSara, room1, t3.start, t3.end, [procFilling.id], 'confirmed');

        const t4 = makeTime(14, 0, 45);
        addSample(pFatima.id, drSara, room3, t4.start, t4.end, [procFilling.id], 'confirmed');
      } else if (isThu) {
        // Thursday:
        const t1 = makeTime(8, 0, 45);
        addSample(pMohamed.id, drSara, room1, t1.start, t1.end, [procFilling.id], 'confirmed');

        const t2 = makeTime(10, 0, 30);
        addSample(pSara.id, drSara, room2, t2.start, t2.end, [procExam.id], 'waiting', 'phone');

        const t3 = makeTime(12, 0, 45);
        addSample(pKhaled.id, drSara, room3, t3.start, t3.end, [procEndo.id], 'cancelled');

        const t4 = makeTime(14, 0, 45);
        addSample(pKhaled.id, drSara, room2, t4.start, t4.end, [procEndo.id], 'cancelled');
      }
    });

    if (samples.length > 0) {
      Promise.all(samples.map((s) => api.appointments.create(s))).then(() => {
        refetchAppointments();
      });
    }
  }, [weekDays, appointments.length, patients, dentists, procedures, refetchAppointments]);

  // Navigation handlers
  const handlePrevWeek = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 7);
    setSelectedDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 7);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Drag and drop appointment movement
  const handleMoveAppointment = async (apptId: string, newStartAt: string, newEndAt: string) => {
    const current = allAppointments.find((a) => a.id === apptId);
    if (!current) return;

    await updateAppointment({
      id: apptId,
      data: {
        start_at: newStartAt,
        end_at: newEndAt,
        dentist_id: current.dentist_id,
        room_id: current.room_id,
      },
    });
  };

  // Resize appointment duration
  const handleResizeDuration = async (appt: Appointment, newDurationMin: number) => {
    const start = new Date(appt.start_at);
    const end = new Date(start.getTime() + newDurationMin * 60000);

    try {
      await updateAppointment({
        id: appt.id,
        data: {
          start_at: appt.start_at,
          end_at: end.toISOString(),
          dentist_id: appt.dentist_id,
          room_id: appt.room_id,
        },
      });
    } catch {
      // Handled in mutation
    }
  };

  // Open form for a new appointment from an empty slot click
  const handleSlotClick = (dateStr: string, startAt: string, endAt: string, dutyDoctorId?: string) => {
    setEditingAppt(null);
    setFormDefaultDate(dateStr);
    setFormDefaultStart(startAt);
    setFormDefaultEnd(endAt);
    setFormDefaultDoctor(dutyDoctorId || '');
    setIsFormOpen(true);
  };

  // Open form to edit appointment
  const handleAppointmentClick = (appt: Appointment) => {
    setEditingAppt(appt);
    setIsFormOpen(true);
  };

  // Quick reschedule from waiting list
  const handleRescheduleFromWaiting = (appt: Appointment) => {
    setEditingAppt(appt);
    setIsWaitingListOpen(false);
    setIsFormOpen(true);
  };

  const handleInstantConfirm = async (apptId: string) => {
    await updateStatus({ id: apptId, status: 'confirmed' });
  };

  const handleCancelAppt = async (apptId: string) => {
    await updateStatus({ id: apptId, status: 'cancelled' });
  };

  // Save / Update appointment in dialog
  const handleSaveAppointment = async (
    payload: CreateAppointment | UpdateAppointment,
    isEdit: boolean
  ) => {
    if (isEdit && editingAppt) {
      await updateAppointment({ id: editingAppt.id, data: payload as UpdateAppointment });
    } else {
      await createAppointment(payload as CreateAppointment);
    }
  };

  // Waiting list items
  const waitingAppointments = useMemo(() => {
    return allAppointments.filter(
      (a) => !a.deleted_at && (a.status === 'waiting' || a.status === 'scheduled' || a.status === 'cancelled')
    );
  }, [allAppointments]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans" dir="rtl">
      {/* 1. Top Bar matching screenshot */}
      <header className="bg-white border-b border-border-default px-6 py-3 flex items-center justify-between shadow-2xs z-30">
        {/* Right side: Clinic info & Date */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-sm font-extrabold text-brand-blue tracking-tight">
              عيادة الأسنان الاحترافية
            </h1>
            <span className="text-[11px] font-medium text-text-secondary">
              {weekDays[0]?.fullFormattedAr || 'السبت، 14 أكتوبر 2023'}
            </span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-text-tertiary absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث عن مريض أو موعد..."
              className="w-full bg-gray-50 text-xs text-text-primary pr-9 pl-4 py-2 rounded-xl border border-border-default focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue transition-colors"
            />
          </div>
        </div>

        {/* Left side: Profile Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsWaitingListOpen(true)}
            className="relative w-9 h-9 rounded-xl border border-border-default hover:bg-gray-50 flex items-center justify-center text-text-secondary transition-colors"
            title="التنبيهات والمواعيد المعلقة"
          >
            <Bell className="w-4 h-4" />
            {stats.unconfirmed > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {stats.unconfirmed}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-9 h-9 rounded-xl bg-brand-blue text-white flex items-center justify-center font-bold text-xs shadow-xs">
              أخ
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-text-primary">د. أحمد خالد</div>
              <div className="text-[10px] font-medium text-text-tertiary">الطبيب المسؤول</div>
            </div>
          </div>
        </div>
      </header>

      {/* Toast and Alert banners */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {conflictAlert && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="w-4 h-4" />
          <span>{conflictAlert}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 p-4 lg:p-6 max-w-[1700px] w-full mx-auto space-y-4">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-text-primary">
            تقويم المواعيد الأسبوعي وتنسيق الفريق
          </h2>
        </div>

        {/* Top Row: Rooms Status Bar */}
        <RoomsStatusBar
          unconfirmedCount={stats.unconfirmed}
          selectedRoomId={selectedRoom}
          onSelectRoom={(roomId) => setSelectedRoom(roomId)}
          onOpenWaitingList={() => setIsWaitingListOpen(true)}
        />

        {/* Two-Column Layout: Center Calendar + Left Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Calendar View (9 cols on large screen) */}
          <div className="lg:col-span-9 order-1">
            <WeekCalendar
              weekDays={weekDays}
              appointmentsByDay={appointmentsByDay}
              allAppointments={allAppointments}
              patientsMap={patientsMap}
              dentistsMap={dentistsMap}
              roomsMap={roomsMap}
              proceduresMap={proceduresMap}
              dentists={dentists}
              rooms={rooms}
              selectedDentist={selectedDentist}
              onChangeDentist={setSelectedDentist}
              selectedRoom={selectedRoom}
              onChangeRoom={setSelectedRoom}
              onNavigatePrevWeek={handlePrevWeek}
              onNavigateNextWeek={handleNextWeek}
              onNavigateToday={handleToday}
              onAddNewAppointment={() => {
                setEditingAppt(null);
                setFormDefaultDate('');
                setFormDefaultStart('');
                setFormDefaultEnd('');
                setFormDefaultDoctor('');
                setIsFormOpen(true);
              }}
              onAddNewPatient={() => {
                setEditingAppt(null);
                setIsFormOpen(true);
              }}
              onAppointmentClick={handleAppointmentClick}
              onSlotClick={handleSlotClick}
              onMoveAppointment={handleMoveAppointment}
              onResizeDuration={handleResizeDuration}
              unconfirmedCount={stats.unconfirmed}
              onOpenWaitingList={() => setIsWaitingListOpen(true)}
            />
          </div>

          {/* Left Sidebar (3 cols on large screen in RTL) */}
          <div className="lg:col-span-3 order-2 space-y-4">
            {/* Upcoming Events */}
            <UpcomingEvents
              appointments={appointments}
              patientsMap={patientsMap}
              dentistsMap={dentistsMap}
              onSelectAppointment={handleAppointmentClick}
            />

            {/* Team Messages */}
            <TeamMessages />
          </div>
        </div>
      </main>

      {/* Appointment Form Modal */}
      <AppointmentFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        appointment={editingAppt}
        defaultDateStr={formDefaultDate}
        defaultStartAt={formDefaultStart}
        defaultEndAt={formDefaultEnd}
        defaultDentistId={formDefaultDoctor}
        patients={patients}
        dentists={dentists}
        rooms={rooms}
        procedures={procedures}
        allAppointments={allAppointments}
        onSave={handleSaveAppointment}
        onPatientCreated={() => {
          refetchPatients();
        }}
      />

      {/* Waiting List Drawer / Modal */}
      <WaitingList
        isOpen={isWaitingListOpen}
        onClose={() => setIsWaitingListOpen(false)}
        waitingAppointments={waitingAppointments}
        patientsMap={patientsMap}
        dentistsMap={dentistsMap}
        onReschedule={handleRescheduleFromWaiting}
        onConfirmInstant={handleInstantConfirm}
        onCancelAppt={handleCancelAppt}
      />
    </div>
  );
};

export default AppointmentsPage;
