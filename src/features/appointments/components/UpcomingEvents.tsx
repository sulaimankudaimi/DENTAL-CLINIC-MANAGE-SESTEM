import React from 'react';
import { Appointment, Patient, User } from '@shared/contracts';
import { Calendar, ChevronLeft, Clock } from 'lucide-react';
import { formatIsoArabicTime } from '../lib/slots';

interface UpcomingEventsProps {
  appointments: Appointment[];
  patientsMap: Map<string, Patient>;
  dentistsMap: Map<string, User>;
  onSelectAppointment?: (appt: Appointment) => void;
}

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  appointments,
  patientsMap,
  dentistsMap,
  onSelectAppointment,
}) => {
  // Sort by start time, filter upcoming
  const upcomingList = appointments
    .filter((a) => !a.deleted_at && a.status !== 'cancelled')
    .slice(0, 5);

  return (
    <div
      id="upcoming-events-card"
      className="bg-white rounded-xl border border-border-default p-4 shadow-sm select-none"
      dir="rtl"
    >
      <div className="flex items-center justify-between pb-3 border-b border-border-default/60 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-text-primary">أحداث قادمة</h3>
        </div>
        <span className="text-xs font-semibold text-text-secondary bg-gray-100 px-2 py-0.5 rounded-full">
          {upcomingList.length}
        </span>
      </div>

      <div className="space-y-2">
        {upcomingList.length === 0 ? (
          <div className="py-6 text-center text-xs text-text-tertiary">
            لا توجد أحداث قادمة مسجلة لهذا اليوم
          </div>
        ) : (
          upcomingList.map((appt) => {
            const patient = patientsMap.get(appt.patient_id);
            const dentist = dentistsMap.get(appt.dentist_id);
            const patientName = patient
              ? `${patient.first_name} ${patient.family_name}`
              : 'مريض';
            const doctorName = dentist?.full_name?.replace(' الراشد', '') || 'د. أحمد خالد';
            const timeLabel = formatIsoArabicTime(appt.start_at);

            return (
              <div
                key={appt.id}
                onClick={() => onSelectAppointment?.(appt)}
                role="button"
                tabIndex={0}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border-default/50 hover:border-brand-blue/30 hover:bg-gray-50/70 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-text-primary group-hover:text-brand-blue transition-colors">
                      {patientName}
                    </div>
                    <div className="text-[11px] text-text-secondary flex items-center gap-1.5 mt-0.5">
                      <span>{doctorName}</span>
                      <span className="text-text-tertiary">•</span>
                      <span className="font-medium text-brand-blue">{timeLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="text-text-tertiary group-hover:text-brand-blue group-hover:-translate-x-0.5 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
