import React, { useState, useRef, useMemo } from 'react';
import type {
  ToothRecord,
  ToothCondition,
  ToothSurface,
} from '@shared/contracts';
import {
  UPPER_PERMANENT_RIGHT,
  UPPER_PERMANENT_LEFT,
  LOWER_PERMANENT_RIGHT,
  LOWER_PERMANENT_LEFT,
  UPPER_PRIMARY_RIGHT,
  UPPER_PRIMARY_LEFT,
  LOWER_PRIMARY_RIGHT,
  LOWER_PRIMARY_LEFT,
  ToothInfo,
} from './lib/teethData';
import { Tooth } from './components/Tooth';
import { ToothPopover } from './components/ToothPopover';
import { ChartToolbar, DentitionMode, ChartViewFilter } from './components/ChartToolbar';
import { ChartLegend } from './components/ChartLegend';
import { ToothTimeline } from './components/ToothTimeline';
import { useToothRecords } from './hooks/useToothRecords';
import { getConditionLabelAr } from './lib/conditionColors';

export interface DentalChartProps {
  patientId: string;
  clinicId?: string;
  dentistId?: string;
  readOnly?: boolean;
  onSelectTooth?: (toothNumber: number, surface?: ToothSurface) => void;
}

export const DentalChart: React.FC<DentalChartProps> = ({
  patientId,
  clinicId = 'c1000000-0000-0000-0000-000000000001',
  dentistId = 'u1000000-0000-0000-0000-000000000002',
  readOnly = false,
  onSelectTooth,
}) => {
  // Chart state
  const [dentitionMode, setDentitionMode] = useState<DentitionMode>('permanent');
  const [viewFilter, setViewFilter] = useState<ChartViewFilter>('all');
  const [activeConditionFilter, setActiveConditionFilter] = useState<ToothCondition | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [timelineDate, setTimelineDate] = useState<string | null>(null);

  // Quick Exam Mode state
  const [isQuickExamActive, setIsQuickExamActive] = useState(false);
  const [quickExamCondition, setQuickExamCondition] = useState<ToothCondition>('caries');

  // Interactive Selection & Popover state
  const [selectedTooth, setSelectedTooth] = useState<ToothInfo | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<ToothSurface | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  // Tooltip state
  const [hoveredTooth, setHoveredTooth] = useState<ToothInfo | null>(null);
  const [hoveredSurface, setHoveredSurface] = useState<ToothSurface | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  // API Integration via Hook
  const {
    records,
    treatments,
    toothProcedures,
    saveRecord,
    addProcedureToPlan,
  } = useToothRecords({
    patientId,
    clinicId,
    dentistId,
    timelineDate,
  });

  // Filter records based on viewFilter
  const displayedRecords = useMemo(() => {
    let filtered = records;
    if (viewFilter === 'existing') {
      filtered = filtered.filter((r) => r.status === 'existing');
    } else if (viewFilter === 'planned') {
      filtered = filtered.filter((r) => r.status === 'planned');
    } else if (viewFilter === 'completed') {
      filtered = filtered.filter((r) => r.status === 'completed');
    }

    if (activeConditionFilter) {
      filtered = filtered.filter((r) => r.condition === activeConditionFilter);
    }
    return filtered;
  }, [records, viewFilter, activeConditionFilter]);

  // Group records by tooth number
  const recordsByTooth = useMemo(() => {
    const map = new Map<number, ToothRecord[]>();
    displayedRecords.forEach((r) => {
      const list = map.get(r.tooth_number) || [];
      list.push(r);
      map.set(r.tooth_number, list);
    });
    return map;
  }, [displayedRecords]);

  // Handlers for Zoom
  const handleZoomIn = () => setZoom((prev) => Math.min(1.6, prev + 0.15));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.7, prev - 0.15));
  const handleZoomReset = () => setZoom(1);

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Handle Tooth Click
  const handleToothClick = async (
    tooth: ToothInfo,
    surface: ToothSurface = 'whole',
    event?: React.MouseEvent
  ) => {
    if (readOnly) return;

    onSelectTooth?.(tooth.fdi_number, surface);

    // If Quick Exam mode is active, apply the selected condition immediately
    if (isQuickExamActive) {
      await saveRecord({
        tooth_number: tooth.fdi_number,
        condition: quickExamCondition,
        surface: surface || 'whole',
        status: 'existing',
        note: `فحص سريع (${getConditionLabelAr(quickExamCondition)})`,
      });
      return;
    }

    // Normal mode: Open Popover
    setSelectedTooth(tooth);
    setSelectedSurface(surface);

    if (event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setPopoverPos({
        x: rect.right || event.clientX,
        y: rect.top || event.clientY,
      });
    } else {
      setPopoverPos({ x: window.innerWidth / 2, y: 250 });
    }
  };

  // Handle Tooth Hover
  const handleToothHover = (
    tooth: ToothInfo | null,
    surface: ToothSurface | null = null,
    event?: React.MouseEvent
  ) => {
    setHoveredTooth(tooth);
    setHoveredSurface(surface);
    if (event && tooth) {
      setTooltipPos({ x: event.clientX, y: event.clientY });
    } else if (!tooth) {
      setTooltipPos(null);
    }
  };

  // Close Popover
  const handleClosePopover = () => {
    setSelectedTooth(null);
    setSelectedSurface(null);
    setPopoverPos(null);
  };

  // Find latest treatment for hovered tooth
  const hoveredToothTreatment = useMemo(() => {
    if (!hoveredTooth) return null;
    return treatments.find((t) => t.tooth_number === hoveredTooth.fdi_number);
  }, [hoveredTooth, treatments]);

  // Find current condition for hovered tooth
  const hoveredToothRecords = useMemo(() => {
    if (!hoveredTooth) return [];
    return records.filter((r) => r.tooth_number === hoveredTooth.fdi_number);
  }, [hoveredTooth, records]);

  return (
    <div className="space-y-3" id="interactive-odontogram-root">
      {/* 1. Top Toolbar */}
      <ChartToolbar
        dentitionMode={dentitionMode}
        onDentitionModeChange={setDentitionMode}
        viewFilter={viewFilter}
        onViewFilterChange={setViewFilter}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onPrint={handlePrint}
        isTimelineOpen={isTimelineOpen}
        onToggleTimeline={() => setIsTimelineOpen(!isTimelineOpen)}
        isQuickExamActive={isQuickExamActive}
        onToggleQuickExam={() => setIsQuickExamActive(!isQuickExamActive)}
        quickExamCondition={quickExamCondition}
        onQuickExamConditionChange={setQuickExamCondition}
      />

      {/* 2. Timeline Comparison Bar (if toggled) */}
      {isTimelineOpen && (
        <ToothTimeline
          records={records}
          treatments={treatments}
          selectedDate={timelineDate}
          onSelectDate={setTimelineDate}
          onClose={() => setIsTimelineOpen(false)}
        />
      )}

      {/* 3. Main Odontogram Canvas Card */}
      <div
        ref={chartContainerRef}
        className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs overflow-x-auto relative min-h-[460px] select-none"
        id="odontogram-canvas-container"
      >
        {/* Clinical Orientation Indicators */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-3 pb-3 border-b border-slate-100 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>يمين المريض (Right)</span>
          </div>
          <div className="text-center font-mono text-[11px] text-slate-400">
            مخطط الأسنان السريري التفاعلي (FDI Two-Digit Notation)
          </div>
          <div className="flex items-center gap-1.5">
            <span>يسار المريض (Left)</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
          </div>
        </div>

        {/* Scalable Chart Canvas */}
        <div
          className="flex flex-col items-center justify-center py-4 transition-transform duration-200 origin-top"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          {/* ================= UPPER JAW (Maxilla) ================= */}
          <div className="w-full flex flex-col items-center relative mb-4">
            <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-2">
              <span>الفك العلوي (Maxilla)</span>
              <span className="text-[10px] text-slate-400 font-mono">18→11 | 21→28</span>
            </div>

            {/* Upper Permanent Row (18-11 and 21-28) */}
            {(dentitionMode === 'permanent' || dentitionMode === 'mixed') && (
              <div className="flex items-center justify-center gap-1 sm:gap-2 relative">
                {/* Upper Right (18 -> 11) */}
                <div className="flex items-center gap-1">
                  {UPPER_PERMANENT_RIGHT.map((tooth) => (
                    <Tooth
                      key={tooth.fdi_number}
                      tooth={tooth}
                      records={recordsByTooth.get(tooth.fdi_number) || []}
                      treatments={treatments}
                      isSelected={selectedTooth?.fdi_number === tooth.fdi_number}
                      selectedSurface={
                        selectedTooth?.fdi_number === tooth.fdi_number ? selectedSurface : null
                      }
                      readOnly={readOnly}
                      onToothClick={handleToothClick}
                      onToothHover={handleToothHover}
                    />
                  ))}
                </div>

                {/* Dental Midline Indicator (خط المنتصف) */}
                <div
                  className="w-0.5 h-36 bg-blue-400/40 border-r border-dashed border-blue-400 mx-1 flex flex-col items-center justify-center"
                  title="خط المنتصف السريري (Midline)"
                >
                  <span className="bg-blue-600 text-white text-[9px] font-mono px-1 py-0.5 rounded-full rotate-90 my-auto">
                    وسط
                  </span>
                </div>

                {/* Upper Left (21 -> 28) */}
                <div className="flex items-center gap-1">
                  {UPPER_PERMANENT_LEFT.map((tooth) => (
                    <Tooth
                      key={tooth.fdi_number}
                      tooth={tooth}
                      records={recordsByTooth.get(tooth.fdi_number) || []}
                      treatments={treatments}
                      isSelected={selectedTooth?.fdi_number === tooth.fdi_number}
                      selectedSurface={
                        selectedTooth?.fdi_number === tooth.fdi_number ? selectedSurface : null
                      }
                      readOnly={readOnly}
                      onToothClick={handleToothClick}
                      onToothHover={handleToothHover}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upper Primary Row (55-51 and 61-65) */}
            {(dentitionMode === 'primary' || dentitionMode === 'mixed') && (
              <div className="mt-3 pt-2 border-t border-dashed border-amber-200 flex items-center justify-center gap-1 sm:gap-2">
                <div className="text-[10px] font-bold text-amber-700 mx-2">
                  لبني علوي (55→51 | 61→65):
                </div>
                <div className="flex items-center gap-1">
                  {UPPER_PRIMARY_RIGHT.map((tooth) => (
                    <Tooth
                      key={tooth.fdi_number}
                      tooth={tooth}
                      compact
                      records={recordsByTooth.get(tooth.fdi_number) || []}
                      treatments={treatments}
                      isSelected={selectedTooth?.fdi_number === tooth.fdi_number}
                      selectedSurface={
                        selectedTooth?.fdi_number === tooth.fdi_number ? selectedSurface : null
                      }
                      readOnly={readOnly}
                      onToothClick={handleToothClick}
                      onToothHover={handleToothHover}
                    />
                  ))}
                </div>

                <div className="w-0.5 h-28 bg-amber-400 border-r border-dashed border-amber-400 mx-1" />

                <div className="flex items-center gap-1">
                  {UPPER_PRIMARY_LEFT.map((tooth) => (
                    <Tooth
                      key={tooth.fdi_number}
                      tooth={tooth}
                      compact
                      records={recordsByTooth.get(tooth.fdi_number) || []}
                      treatments={treatments}
                      isSelected={selectedTooth?.fdi_number === tooth.fdi_number}
                      selectedSurface={
                        selectedTooth?.fdi_number === tooth.fdi_number ? selectedSurface : null
                      }
                      readOnly={readOnly}
                      onToothClick={handleToothClick}
                      onToothHover={handleToothHover}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Occlusal Plane Separator (مستوى الإطباق) */}
          <div className="w-full my-3 flex items-center justify-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
              المستوى الإطباقي (Occlusal Plane)
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* ================= LOWER JAW (Mandible) ================= */}
          <div className="w-full flex flex-col items-center relative mt-2">
            {/* Lower Primary Row (85-81 and 71-75) */}
            {(dentitionMode === 'primary' || dentitionMode === 'mixed') && (
              <div className="mb-3 pb-2 border-b border-dashed border-amber-200 flex items-center justify-center gap-1 sm:gap-2">
                <div className="text-[10px] font-bold text-amber-700 mx-2">
                  لبني سفلي (85→81 | 71→75):
                </div>
                <div className="flex items-center gap-1">
                  {LOWER_PRIMARY_RIGHT.map((tooth) => (
                    <Tooth
                      key={tooth.fdi_number}
                      tooth={tooth}
                      compact
                      records={recordsByTooth.get(tooth.fdi_number) || []}
                      treatments={treatments}
                      isSelected={selectedTooth?.fdi_number === tooth.fdi_number}
                      selectedSurface={
                        selectedTooth?.fdi_number === tooth.fdi_number ? selectedSurface : null
                      }
                      readOnly={readOnly}
                      onToothClick={handleToothClick}
                      onToothHover={handleToothHover}
                    />
                  ))}
                </div>

                <div className="w-0.5 h-28 bg-amber-400 border-r border-dashed border-amber-400 mx-1" />

                <div className="flex items-center gap-1">
                  {LOWER_PRIMARY_LEFT.map((tooth) => (
                    <Tooth
                      key={tooth.fdi_number}
                      tooth={tooth}
                      compact
                      records={recordsByTooth.get(tooth.fdi_number) || []}
                      treatments={treatments}
                      isSelected={selectedTooth?.fdi_number === tooth.fdi_number}
                      selectedSurface={
                        selectedTooth?.fdi_number === tooth.fdi_number ? selectedSurface : null
                      }
                      readOnly={readOnly}
                      onToothClick={handleToothClick}
                      onToothHover={handleToothHover}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Lower Permanent Row (48-41 and 31-38) */}
            {(dentitionMode === 'permanent' || dentitionMode === 'mixed') && (
              <div className="flex items-center justify-center gap-1 sm:gap-2 relative">
                {/* Lower Right (48 -> 41) */}
                <div className="flex items-center gap-1">
                  {LOWER_PERMANENT_RIGHT.map((tooth) => (
                    <Tooth
                      key={tooth.fdi_number}
                      tooth={tooth}
                      records={recordsByTooth.get(tooth.fdi_number) || []}
                      treatments={treatments}
                      isSelected={selectedTooth?.fdi_number === tooth.fdi_number}
                      selectedSurface={
                        selectedTooth?.fdi_number === tooth.fdi_number ? selectedSurface : null
                      }
                      readOnly={readOnly}
                      onToothClick={handleToothClick}
                      onToothHover={handleToothHover}
                    />
                  ))}
                </div>

                {/* Dental Midline Indicator (خط المنتصف) */}
                <div
                  className="w-0.5 h-36 bg-blue-400/40 border-r border-dashed border-blue-400 mx-1 flex flex-col items-center justify-center"
                  title="خط المنتصف السريري (Midline)"
                >
                  <span className="bg-blue-600 text-white text-[9px] font-mono px-1 py-0.5 rounded-full rotate-90 my-auto">
                    وسط
                  </span>
                </div>

                {/* Lower Left (31 -> 38) */}
                <div className="flex items-center gap-1">
                  {LOWER_PERMANENT_LEFT.map((tooth) => (
                    <Tooth
                      key={tooth.fdi_number}
                      tooth={tooth}
                      records={recordsByTooth.get(tooth.fdi_number) || []}
                      treatments={treatments}
                      isSelected={selectedTooth?.fdi_number === tooth.fdi_number}
                      selectedSurface={
                        selectedTooth?.fdi_number === tooth.fdi_number ? selectedSurface : null
                      }
                      readOnly={readOnly}
                      onToothClick={handleToothClick}
                      onToothHover={handleToothHover}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="text-[11px] font-bold text-slate-400 mt-2 flex items-center gap-2">
              <span>الفك السفلي (Mandible)</span>
              <span className="text-[10px] text-slate-400 font-mono">48→41 | 31→38</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Chart Legend */}
      <ChartLegend
        records={records}
        activeFilter={activeConditionFilter}
        onFilterCondition={setActiveConditionFilter}
      />

      {/* 5. Rich Hover Tooltip */}
      {hoveredTooth && tooltipPos && (
        <div
          style={{
            top: `${tooltipPos.y + 16}px`,
            left: `${Math.min(tooltipPos.x + 16, window.innerWidth - 240)}px`,
          }}
          className="fixed z-50 pointer-events-none bg-slate-900/90 backdrop-blur-xs text-white px-3 py-2 rounded-xl shadow-xl border border-slate-700 text-xs animate-in fade-in duration-100 min-w-[200px]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1 mb-1">
            <span className="font-bold text-blue-300 font-mono text-sm">
              #{hoveredTooth.fdi_number}
            </span>
            <span className="text-[11px] text-slate-300 font-medium truncate">
              {hoveredTooth.name_ar}
            </span>
          </div>

          {hoveredSurface && (
            <div className="text-[11px] text-blue-200">
              السطح: <span className="font-bold">{hoveredSurface}</span>
            </div>
          )}

          <div className="text-[11px] text-slate-300">
            الحالة:{' '}
            <span className="font-bold text-white">
              {hoveredToothRecords.length > 0
                ? getConditionLabelAr(hoveredToothRecords[0].condition)
                : 'سليم'}
            </span>
          </div>

          {hoveredToothTreatment && (
            <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-emerald-400">
              آخر إجراء:{' '}
              <span className="text-white">
                {hoveredToothTreatment.clinical_notes || 'إجراء علاجي'}
              </span>
              <div className="text-slate-400 font-mono">
                {new Date(hoveredToothTreatment.performed_at).toLocaleDateString('ar-SA')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Interactive Tooth Popover */}
      {selectedTooth && popoverPos && !readOnly && (
        <ToothPopover
          tooth={selectedTooth}
          surface={selectedSurface}
          records={recordsByTooth.get(selectedTooth.fdi_number) || []}
          procedures={toothProcedures}
          position={popoverPos}
          onClose={handleClosePopover}
          onSaveRecord={saveRecord}
          onAddProcedureToPlan={addProcedureToPlan}
        />
      )}
    </div>
  );
};
