import React, { useState } from 'react';
import { DentalChart } from '@/features/dental-chart';
import { Odontogram, CONDITION_COLORS } from '@/components/dental/Odontogram';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import type {
  ToothRecord,
  ToothCondition,
  ToothSurface,
  Treatment,
} from '@shared/contracts';
import {
  TOOTH_CONDITIONS,
  TOOTH_CONDITION_AR,
  TOOTH_SURFACES,
  TOOTH_SURFACE_AR,
} from '@shared/contracts';
import {
  Activity,
  FileEdit,
  Layers,
} from 'lucide-react';

export interface PatientOdontogramSectionProps {
  records: ToothRecord[];
  treatments?: Treatment[];
  patientId?: string;
  onUpdateCondition: (
    toothNumber: number,
    condition: ToothCondition,
    surfaces?: ToothSurface[],
    note?: string
  ) => void;
}

export const PatientOdontogramSection: React.FC<PatientOdontogramSectionProps> = ({
  records,
  treatments = [],
  patientId,
  onUpdateCondition,
}) => {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(16);
  const [selectedCondition, setSelectedCondition] = useState<ToothCondition>('healthy');
  const [selectedSurface, setSelectedSurface] = useState<ToothSurface>('whole');
  const [noteText, setNoteText] = useState('');

  if (patientId) {
    return <DentalChart patientId={patientId} onSelectTooth={(t, s) => {
      setSelectedTooth(t);
      if (s) setSelectedSurface(s);
    }} />;
  }

  // Find record for selected tooth
  const currentRecord = selectedTooth
    ? records.find((r) => r.tooth_number === selectedTooth)
    : undefined;

  // Find treatments performed on this tooth
  const toothTreatments = selectedTooth
    ? treatments.filter((t) => t.tooth_number === selectedTooth)
    : [];

  // Tooth counts summary
  const conditionCounts = records.reduce<Record<string, number>>((acc, r) => {
    acc[r.condition] = (acc[r.condition] || 0) + 1;
    return acc;
  }, {});

  const handleSelectTooth = (toothNum: number) => {
    setSelectedTooth(toothNum);
    const existing = records.find((r) => r.tooth_number === toothNum);
    if (existing) {
      setSelectedCondition(existing.condition);
      setSelectedSurface(existing.surface || 'whole');
      setNoteText(existing.note || '');
    } else {
      setSelectedCondition('healthy');
      setSelectedSurface('whole');
      setNoteText('');
    }
  };

  const handleSaveCondition = () => {
    if (!selectedTooth) return;
    onUpdateCondition(selectedTooth, selectedCondition, [selectedSurface], noteText);
  };

  return (
    <div id="patient-odontogram-section" className="space-y-4">
      {/* 8/12 and 4/12 Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Odontogram Interactive Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-navy" />
                مخطط الأسنان السريري التفاعلي (FDI Notation)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                انقر على أي سن لعرض حالته السريرية، تحديث التشخيص، أو الاطلاع على العلاجات المنفذة
              </p>
            </div>

            {selectedTooth && (
              <span className="font-mono text-xs px-3 py-1 bg-brand-navy text-white font-bold rounded-lg shadow-sm">
                السن المحدد: #{selectedTooth}
              </span>
            )}
          </div>

          {/* Odontogram Component */}
          <div className="overflow-x-auto py-2">
            <Odontogram
              records={records}
              selectedTooth={selectedTooth}
              onSelectTooth={handleSelectTooth}
              onUpdateToothCondition={(toothNum, cond) => {
                setSelectedTooth(toothNum);
                setSelectedCondition(cond);
                onUpdateCondition(toothNum, cond, [selectedSurface], noteText);
              }}
            />
          </div>

          {/* Condition Counts Badges */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 ml-1">إحصائيات الأسنان:</span>
            {Object.entries(CONDITION_COLORS).map(([condKey, conf]) => {
              const count = conditionCounts[condKey] || 0;
              if (count === 0 && condKey !== 'healthy' && condKey !== 'caries' && condKey !== 'filled') {
                return null;
              }
              return (
                <span
                  key={condKey}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${conf.bg} ${conf.border} ${conf.text}`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {conf.label}: <strong className="font-bold">{count}</strong>
                </span>
              );
            })}
          </div>
        </div>

        {/* Clinical Tooth Inspector Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Tooth Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                معاينة وتعديل السن {selectedTooth ? `#${selectedTooth}` : ''}
              </h3>
              {currentRecord && (
                <Badge
                  variant={
                    currentRecord.condition === 'healthy'
                      ? 'success'
                      : currentRecord.condition === 'caries'
                      ? 'danger'
                      : 'default'
                  }
                >
                  {TOOTH_CONDITION_AR[currentRecord.condition] || currentRecord.condition}
                </Badge>
              )}
            </div>

            {selectedTooth ? (
              <div className="space-y-4">
                {/* Tooth Condition Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    الحالة والتشخيص:
                  </label>
                  <Select
                    value={selectedCondition}
                    onValueChange={(val) => setSelectedCondition(val as ToothCondition)}
                    options={TOOTH_CONDITIONS.map((c) => ({
                      label: TOOTH_CONDITION_AR[c],
                      value: c,
                    }))}
                  />
                </div>

                {/* Surface Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    السطح المصاب / المعالج:
                  </label>
                  <Select
                    value={selectedSurface}
                    onValueChange={(val) => setSelectedSurface(val as ToothSurface)}
                    options={TOOTH_SURFACES.map((s) => ({
                      label: TOOTH_SURFACE_AR[s],
                      value: s,
                    }))}
                  />
                </div>

                {/* Clinical Notes */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    ملاحظات سريرية للسن:
                  </label>
                  <textarea
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="مثال: تسوس عميق مقارب للعصب، نخر دهليزي..."
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none transition-all"
                  />
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSaveCondition}
                  className="w-full text-xs"
                  icon={<FileEdit className="w-3.5 h-3.5" />}
                >
                  حفظ وتحديث حالة السن
                </Button>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                انقر على أي سن في المخطط لعرض خيارات التعديل
              </div>
            )}
          </div>

          {/* Treatments History on this Tooth */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>سجل الإجراءات على السن {selectedTooth ? `#${selectedTooth}` : ''}</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {toothTreatments.length} إجراء
              </span>
            </h4>

            {toothTreatments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded-lg">
                لا توجد علاجات مسجلة على هذا السن
              </p>
            ) : (
              <div className="space-y-2">
                {toothTreatments.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-start justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {t.surface ? `سطح (${TOOTH_SURFACE_AR[t.surface] || t.surface})` : 'السن بالكامل'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        تاريخ التنفيذ: {new Date(t.performed_at).toLocaleDateString('ar-SA')}
                      </p>
                      {t.clinical_notes && (
                        <p className="text-[11px] text-slate-600 mt-1 italic">"{t.clinical_notes}"</p>
                      )}
                    </div>
                    <Badge variant={t.status === 'completed' ? 'success' : 'default'} className="text-[10px]">
                      {t.status === 'completed' ? 'منفذ' : 'قيد العلاج'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
