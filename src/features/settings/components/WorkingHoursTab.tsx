import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import type { WorkingHoursSettings, DayWorkingSchedule, DayShift, OfficialHoliday } from '../types';

interface WorkingHoursTabProps {
  settings: WorkingHoursSettings;
  onSave: (updated: WorkingHoursSettings) => void;
  isSaving: boolean;
}

const SLOT_DURATIONS = [
  { value: 15, label: '15 دقيقة', desc: 'كشوفات سريعة ومتابعات' },
  { value: 20, label: '20 دقيقة', desc: 'مناسب لعيادات الفحص العام' },
  { value: 30, label: '30 دقيقة (الموصى به)', desc: 'المعيار القياسي لمعظم علاجات الأسنان' },
  { value: 45, label: '45 دقيقة', desc: 'مناسب لعلاج العصب والخلع' },
  { value: 60, label: '60 دقيقة', desc: 'للعمليات الجراحية والزراعة والتجميل' },
];

export const WorkingHoursTab: React.FC<WorkingHoursTabProps> = ({
  settings,
  onSave,
  isSaving,
}) => {
  const { showToast } = useToast();
  const [schedule, setSchedule] = useState<DayWorkingSchedule[]>(settings.schedule);
  const [holidays, setHolidays] = useState<OfficialHoliday[]>(settings.holidays);
  const [slotDuration, setSlotDuration] = useState<number>(settings.default_slot_duration_min);

  // Holiday Modal
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayTitle, setHolidayTitle] = useState('');
  const [holidayStartDate, setHolidayStartDate] = useState('');
  const [holidayEndDate, setHolidayEndDate] = useState('');
  const [holidayDaysCount, setHolidayDaysCount] = useState(1);
  const [holidayRecurring, setHolidayRecurring] = useState(true);

  // Toggle Day open / closed
  const handleToggleDay = (dayIndex: number) => {
    setSchedule((prev) =>
      prev.map((day, idx) => {
        if (idx === dayIndex) {
          const nextOpen = !day.is_open;
          return {
            ...day,
            is_open: nextOpen,
            shifts: nextOpen && day.shifts.length === 0
              ? [{ id: `shift-${Date.now()}`, name: 'الفترة الأساسية', start_time: '09:00', end_time: '17:00' }]
              : day.shifts,
          };
        }
        return day;
      })
    );
  };

  // Add Shift to a Day
  const handleAddShift = (dayIndex: number) => {
    setSchedule((prev) =>
      prev.map((day, idx) => {
        if (idx === dayIndex) {
          const shiftNum = day.shifts.length + 1;
          const newShift: DayShift = {
            id: `shift-${Date.now()}-${Math.random()}`,
            name: `الفترة ${shiftNum}`,
            start_time: shiftNum === 2 ? '16:30' : '09:00',
            end_time: shiftNum === 2 ? '21:30' : '13:00',
          };
          return {
            ...day,
            is_open: true,
            shifts: [...day.shifts, newShift],
          };
        }
        return day;
      })
    );
  };

  // Update Shift times
  const handleUpdateShift = (
    dayIndex: number,
    shiftId: string,
    field: 'name' | 'start_time' | 'end_time',
    value: string
  ) => {
    setSchedule((prev) =>
      prev.map((day, idx) => {
        if (idx === dayIndex) {
          return {
            ...day,
            shifts: day.shifts.map((s) => (s.id === shiftId ? { ...s, [field]: value } : s)),
          };
        }
        return day;
      })
    );
  };

  // Delete Shift
  const handleDeleteShift = (dayIndex: number, shiftId: string) => {
    setSchedule((prev) =>
      prev.map((day, idx) => {
        if (idx === dayIndex) {
          const remaining = day.shifts.filter((s) => s.id !== shiftId);
          return {
            ...day,
            is_open: remaining.length > 0,
            shifts: remaining,
          };
        }
        return day;
      })
    );
  };

  // Save All
  const handleSaveAll = () => {
    onSave({
      schedule,
      holidays,
      default_slot_duration_min: slotDuration,
    });
  };

  // Add Holiday
  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayTitle.trim() || !holidayStartDate) return;

    const newHol: OfficialHoliday = {
      id: `hol-${Date.now()}`,
      title: holidayTitle,
      start_date: holidayStartDate,
      end_date: holidayEndDate || holidayStartDate,
      days_count: Number(holidayDaysCount) || 1,
      recurring_annual: holidayRecurring,
    };
    setHolidays([...holidays, newHol]);
    showToast({ title: 'تمت الإضافة', description: 'تمت إضافة العطلة الرسمية بنجاح', variant: 'success' });
    setIsHolidayModalOpen(false);
    setHolidayTitle('');
    setHolidayStartDate('');
    setHolidayEndDate('');
    setHolidayDaysCount(1);
  };

  const handleDeleteHoliday = (id: string) => {
    setHolidays(holidays.filter((h) => h.id !== id));
    showToast({ title: 'تم الحذف', description: 'تم حذف العطلة الرسمية بنجاح', variant: 'success' });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header and Save */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">أوقات العمل وفترات الدوام والعطلات</h2>
            <p className="text-xs text-text-secondary">
              تحديد فترات العمل المتعددة لكل يوم، العطل الرسمية السنوية، والمدة الافتراضية لفتحة الموعد
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          loading={isSaving}
          onClick={handleSaveAll}
          className="gap-2 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>حفظ ومزامنة المواعيد</span>
        </Button>
      </div>

      {/* 1. Default Slot Duration */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-primary">مدة فتحة الموعد الافتراضية (Default Slot Duration)</h3>
            <p className="text-xs text-text-secondary">
              تحدد التقسيم الزمني التلقائي لشبكة جدول المواعيد وسعة الكراسي اليومية
            </p>
          </div>
          <span className="text-xs font-bold text-brand-navy bg-brand-navy/10 px-3 py-1 rounded-full">
            المحدد: {slotDuration} دقيقة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SLOT_DURATIONS.map((slot) => {
            const isSelected = slotDuration === slot.value;
            return (
              <button
                key={slot.value}
                type="button"
                onClick={() => setSlotDuration(slot.value)}
                className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-brand-navy bg-brand-navy/5 ring-2 ring-brand-navy/20'
                    : 'border-surface-border bg-surface-ground hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-xs font-bold ${isSelected ? 'text-brand-navy' : 'text-text-primary'}`}>
                    {slot.label}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-navy" />}
                </div>
                <span className="text-[10px] text-text-secondary leading-tight">{slot.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Multi-Shift Daily Schedule */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border/60">
          <div>
            <h3 className="text-sm font-bold text-text-primary">جدول أيام الأسبوع وفترات الدوام المتعددة</h3>
            <p className="text-xs text-text-secondary">
              يمكنك إضافة فترتي عمل (صباحية ومسائية) لكل يوم وتحديد أيام الإغلاق
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {schedule.map((day, dayIndex) => {
            return (
              <div
                key={day.day_of_week}
                className={`p-4 rounded-xl border transition-all ${
                  day.is_open
                    ? 'border-surface-border bg-surface-ground'
                    : 'border-surface-border/50 bg-slate-50/60 opacity-80'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Day Toggle */}
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.is_open}
                        onChange={() => handleToggleDay(dayIndex)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-text-primary">{day.day_name_ar}</span>
                      {day.is_open ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.5 rounded">
                          مفتوح ({day.shifts.length} فترات)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 bg-slate-200 font-bold px-1.5 py-0.5 rounded">
                          مغلق / عطلة
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Shifts Container */}
                  <div className="flex-1 space-y-2">
                    {day.is_open ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {day.shifts.map((shift) => (
                          <div
                            key={shift.id}
                            className="flex items-center gap-1.5 p-1.5 px-2.5 bg-white border border-surface-border rounded-lg shadow-2xs text-xs"
                          >
                            <input
                              type="text"
                              value={shift.name}
                              onChange={(e) => handleUpdateShift(dayIndex, shift.id, 'name', e.target.value)}
                              className="w-24 text-[11px] font-bold text-text-primary bg-transparent focus:outline-none focus:border-b border-brand-navy"
                              placeholder="اسم الفترة"
                            />
                            <div className="flex items-center gap-1 text-slate-600">
                              <input
                                type="time"
                                value={shift.start_time}
                                onChange={(e) => handleUpdateShift(dayIndex, shift.id, 'start_time', e.target.value)}
                                className="text-xs p-1 rounded border border-surface-border bg-surface-ground focus:outline-none"
                              />
                              <span className="text-xs font-bold text-slate-400">إلى</span>
                              <input
                                type="time"
                                value={shift.end_time}
                                onChange={(e) => handleUpdateShift(dayIndex, shift.id, 'end_time', e.target.value)}
                                className="text-xs p-1 rounded border border-surface-border bg-surface-ground focus:outline-none"
                              />
                            </div>

                            {day.shifts.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteShift(dayIndex, shift.id)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded"
                                title="إلغاء الفترة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddShift(dayIndex)}
                          className="flex items-center gap-1 text-[11px] text-brand-navy hover:text-blue-800 font-bold px-2 py-1.5 rounded-lg border border-dashed border-brand-navy/40 hover:bg-brand-navy/5"
                        >
                          <Plus className="w-3 h-3" />
                          فترة إضافية
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-text-secondary italic">لا توجد مواعيد متاحة في هذا اليوم</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Official Holidays Section */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border/60">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-navy" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">العطلات والإجازات الرسمية للعيادة</h3>
              <p className="text-xs text-text-secondary">
                يتم إيقاف حجز المواعيد تلقائياً في هذه الأيام مع إظهار شارة إجازة في التقويم
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setIsHolidayModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة عطلة رسمية</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-border text-text-secondary text-right">
                <th className="py-2.5 px-3 font-bold">اسم المناسبة / العطلة</th>
                <th className="py-2.5 px-3 font-bold">تاريخ البداية</th>
                <th className="py-2.5 px-3 font-bold">تاريخ النهاية</th>
                <th className="py-2.5 px-3 font-bold">عدد الأيام</th>
                <th className="py-2.5 px-3 font-bold">التكرار</th>
                <th className="py-2.5 px-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {holidays.map((h) => (
                <tr key={h.id} className="hover:bg-surface-ground">
                  <td className="py-3 px-3 font-bold text-text-primary flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{h.title}</span>
                  </td>
                  <td className="py-3 px-3 text-text-secondary font-mono">{h.start_date}</td>
                  <td className="py-3 px-3 text-text-secondary font-mono">{h.end_date}</td>
                  <td className="py-3 px-3 font-bold text-brand-navy">{h.days_count} أيام</td>
                  <td className="py-3 px-3">
                    {h.recurring_annual ? (
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                        سنوي دوري
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        لمرة واحدة
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleDeleteHoliday(h.id)}
                      className="text-text-secondary hover:text-red-600 p-1"
                      title="حذف العطلة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Holiday Modal */}
      <Modal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        title="إضافة عطلة أو إجازة رسمية"
      >
        <form onSubmit={handleAddHoliday} className="space-y-4">
          <Input
            label="اسم العطلة أو المناسبة *"
            value={holidayTitle}
            onChange={(e) => setHolidayTitle(e.target.value)}
            placeholder="مثال: إجازة عيد الفطر المبارك"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="تاريخ البداية *"
              type="date"
              value={holidayStartDate}
              onChange={(e) => setHolidayStartDate(e.target.value)}
              required
            />
            <Input
              label="تاريخ النهاية *"
              type="date"
              value={holidayEndDate}
              onChange={(e) => setHolidayEndDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="إجمالي عدد الأيام"
              type="number"
              min={1}
              value={holidayDaysCount}
              onChange={(e) => setHolidayDaysCount(parseInt(e.target.value) || 1)}
            />

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={holidayRecurring}
                  onChange={(e) => setHolidayRecurring(e.target.checked)}
                  className="rounded text-brand-navy"
                />
                <span className="font-bold text-text-primary">تكرار سنوي تلقائياً</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-surface-border">
            <Button type="button" variant="outline" onClick={() => setIsHolidayModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary">
              إضافة العطلة
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
