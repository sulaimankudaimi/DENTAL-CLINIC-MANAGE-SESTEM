import React, { useState } from 'react';
import { Appointment, Patient, User } from '@shared/contracts';
import {
  X,
  Clock,
  RotateCcw,
  CheckCircle,
  Calendar,
  Phone,
} from 'lucide-react';
import { formatIsoArabicTime } from '../lib/slots';
import clsx from 'clsx';

interface WaitingListProps {
  isOpen: boolean;
  onClose: () => void;
  waitingAppointments: Appointment[];
  patientsMap: Map<string, Patient>;
  dentistsMap: Map<string, User>;
  onReschedule: (appt: Appointment) => void;
  onConfirmInstant: (apptId: string) => void;
  onCancelAppt: (apptId: string) => void;
}

export const WaitingList: React.FC<WaitingListProps> = ({
  isOpen,
  onClose,
  waitingAppointments,
  patientsMap,
  dentistsMap,
  onReschedule,
  onConfirmInstant,
  onCancelAppt,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'waiting' | 'cancelled'>('all');

  if (!isOpen) return null;

  const filtered = waitingAppointments.filter((a) => {
    if (filterType === 'waiting') return a.status === 'waiting' || a.status === 'scheduled';
    if (filterType === 'cancelled') return a.status === 'cancelled';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                قائمة الانتظار وإعادة الجدولة السريعة
              </h2>
              <p className="text-[11px] text-text-tertiary">
                إدارة المواعيد غير المؤكدة أو الملغاة لتسكينها في الفترات الشاغرة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pt-3 pb-2 flex items-center gap-2 border-b border-border-default/40">
          <button
            onClick={() => setFilterType('all')}
            className={clsx(
              'px-3 py-1 rounded-lg text-xs font-semibold transition-colors',
              filterType === 'all'
                ? 'bg-brand-blue text-white'
                : 'text-text-secondary hover:bg-gray-100'
            )}
          >
            الكل ({waitingAppointments.length})
          </button>
          <button
            onClick={() => setFilterType('waiting')}
            className={clsx(
              'px-3 py-1 rounded-lg text-xs font-semibold transition-colors',
              filterType === 'waiting'
                ? 'bg-amber-600 text-white'
                : 'text-text-secondary hover:bg-gray-100'
            )}
          >
            في الانتظار
          </button>
          <button
            onClick={() => setFilterType('cancelled')}
            className={clsx(
              'px-3 py-1 rounded-lg text-xs font-semibold transition-colors',
              filterType === 'cancelled'
                ? 'bg-rose-600 text-white'
                : 'text-text-secondary hover:bg-gray-100'
            )}
          >
            الملغاة
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <h4 className="text-xs font-bold text-text-primary">لا توجد مواعيد معلقة حالياً</h4>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                جميع المواعيد مؤكدة ومنسقة على التقويم الأسبوعي
              </p>
            </div>
          ) : (
            filtered.map((appt) => {
              const patient = patientsMap.get(appt.patient_id);
              const dentist = dentistsMap.get(appt.dentist_id);
              const patientName = patient
                ? `${patient.first_name} ${patient.family_name}`
                : 'مريض';
              const doctorName = dentist?.full_name || 'د. أحمد خالد';
              const dateOnly = appt.start_at.substring(0, 10);
              const timeLabel = formatIsoArabicTime(appt.start_at);

              const isCancelled = appt.status === 'cancelled';

              return (
                <div
                  key={appt.id}
                  className="p-3.5 rounded-xl border border-border-default hover:border-brand-blue/30 bg-white transition-all flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-primary">{patientName}</span>
                      <span
                        className={clsx(
                          'text-[10px] font-semibold px-2 py-0.5 rounded-md',
                          isCancelled
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        )}
                      >
                        {isCancelled ? 'ملغى' : 'في الانتظار'}
                      </span>
                    </div>

                    <div className="text-[11px] text-text-secondary flex items-center gap-2">
                      <span>{doctorName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-text-tertiary">
                        <Calendar className="w-3 h-3" />
                        <span>{dateOnly} ({timeLabel})</span>
                      </span>
                    </div>

                    {patient?.phone && (
                      <div className="text-[11px] text-text-tertiary flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span dir="ltr">{patient.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onReschedule(appt)}
                      className="px-3 py-1.5 rounded-lg border border-brand-blue text-brand-blue hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="إعادة الجدولة في موعد جديد"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>إعادة جدولة</span>
                    </button>

                    {!isCancelled && (
                      <>
                        <button
                          type="button"
                          onClick={() => onConfirmInstant(appt.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="تأكيد الموعد فورياً"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>تأكيد</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onCancelAppt(appt.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs transition-colors"
                          title="إلغاء الموعد"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
