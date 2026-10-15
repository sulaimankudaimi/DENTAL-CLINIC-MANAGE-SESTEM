import React, { useState } from 'react';
import type { ToothInfo } from '../lib/teethData';
import type {
  ToothRecord,
  ToothCondition,
  ToothSurface as ToothSurfaceType,
  Treatment,
} from '@shared/contracts';
import { getAnatomicalPaths, getSurfacePolygons } from '../lib/toothPaths';
import { getConditionStyle, DENTAL_COLORS, getConditionLabelAr } from '../lib/conditionColors';
import { ToothSurface } from './ToothSurface';

export interface ToothProps {
  tooth: ToothInfo;
  records: ToothRecord[]; // All records for this tooth (whole + individual surfaces)
  treatments?: Treatment[]; // Treatments performed on this tooth
  isSelected?: boolean;
  selectedSurface?: ToothSurfaceType | null;
  onToothClick?: (tooth: ToothInfo, surface?: ToothSurfaceType, event?: React.MouseEvent) => void;
  onToothHover?: (tooth: ToothInfo | null, surface?: ToothSurfaceType | null, event?: React.MouseEvent) => void;
  readOnly?: boolean;
  compact?: boolean;
}

export const Tooth: React.FC<ToothProps> = ({
  tooth,
  records,
  treatments = [],
  isSelected = false,
  selectedSurface = null,
  onToothClick,
  onToothHover,
  readOnly = false,
  compact = false,
}) => {
  const [hoveredSurface, setHoveredSurface] = useState<ToothSurfaceType | null>(null);
  const [isToothHovered, setIsToothHovered] = useState(false);

  // 1. Identify records for this tooth:
  // Whole tooth record (general state)
  const wholeRecord = records.find((r) => r.surface === 'whole' || !r.surface);
  const surfaceRecords = records.filter((r) => r.surface && r.surface !== 'whole');

  // Primary condition of the whole tooth
  const overallCondition: ToothCondition = wholeRecord?.condition || 'healthy';
  const overallStatus = wholeRecord?.status || 'existing';

  // Helper to get condition for a specific surface
  const getSurfaceCondition = (s: ToothSurfaceType): { condition: ToothCondition; status: any } => {
    const sRec = surfaceRecords.find((r) => r.surface === s);
    if (sRec) return { condition: sRec.condition, status: sRec.status };

    // If whole tooth has a localized condition that applies to crown (e.g. crown, missing)
    if (
      overallCondition === 'crown' ||
      overallCondition === 'bridge' ||
      overallCondition === 'missing' ||
      overallCondition === 'caries' ||
      overallCondition === 'filled'
    ) {
      return { condition: overallCondition, status: overallStatus };
    }

    return { condition: 'healthy', status: 'existing' };
  };

  // Has endodontic treatment?
  const hasRootCanal =
    overallCondition === 'root_canal' ||
    records.some((r) => r.condition === 'root_canal') ||
    treatments.some((t) => t.clinical_notes?.includes('عصب') || t.procedure_id?.includes('endo'));

  // Is implant?
  const isImplant = overallCondition === 'implant';

  // Is missing?
  const isMissing = overallCondition === 'missing';

  // Is fractured?
  const isFractured = overallCondition === 'fractured';

  // Anatomical paths for this tooth
  const paths = getAnatomicalPaths(tooth.type, tooth.is_upper);

  // Surface polygons for the 5-surface square
  const isAnterior = tooth.type === 'incisor' || tooth.type === 'canine';
  const surfacePolygons = getSurfacePolygons(tooth.is_upper, tooth.is_right, isAnterior, 42);

  // Overall tooth style
  const crownStyle = getConditionStyle(overallCondition, overallStatus);

  // Color logic for crown & root
  const rootFill = isImplant ? '#0D9488' : '#F8FAFC';
  const rootStroke = isImplant ? '#0F766E' : '#94A3B8';

  const crownFill = isMissing
    ? '#E2E8F0'
    : overallCondition === 'crown'
    ? DENTAL_COLORS.crown.fill
    : overallCondition === 'bridge'
    ? DENTAL_COLORS.bridge.fill
    : '#FFFFFF';

  const crownStroke = isMissing
    ? '#94A3B8'
    : isSelected
    ? '#2563EB'
    : isToothHovered
    ? '#3B82F6'
    : crownStyle.stroke;

  // Handles click on the tooth container or crown/root
  const handleGeneralClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    onToothClick?.(tooth, 'whole', e);
  };

  return (
    <div
      className={`group relative flex flex-col items-center justify-between transition-all duration-150 select-none
        ${compact ? 'w-11' : 'w-14 sm:w-16'}
        ${isSelected ? 'scale-105 z-10' : 'hover:scale-102 hover:z-5'}
      `}
      id={`tooth-${tooth.fdi_number}`}
      onMouseEnter={(e) => {
        setIsToothHovered(true);
        onToothHover?.(tooth, null, e);
      }}
      onMouseLeave={() => {
        setIsToothHovered(false);
        onToothHover?.(null, null);
      }}
    >
      {/* 1. FDI Number badge (placed at top for upper arch, at bottom for lower arch) */}
      {tooth.is_upper && (
        <button
          type="button"
          onClick={handleGeneralClick}
          className={`mb-1 px-1.5 py-0.5 rounded text-xs font-bold font-mono transition-colors
            ${
              isSelected
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                : isToothHovered
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }
          `}
          title={`${tooth.name_ar} (#${tooth.fdi_number})`}
        >
          {tooth.fdi_number}
        </button>
      )}

      {/* 2. Anatomical SVG representation (Root + Crown + Canals + Overlays) */}
      <div
        className="cursor-pointer relative"
        onClick={handleGeneralClick}
        title={`${tooth.name_ar} (#${tooth.fdi_number}) - ${getConditionLabelAr(overallCondition)}`}
      >
        <svg
          viewBox="0 0 54 125"
          className={`w-11 sm:w-12 h-20 transition-all duration-150 ${isMissing ? 'opacity-40' : ''}`}
          style={{ overflow: 'visible' }}
        >
          {/* Defs for hatching patterns (for planned treatments) */}
          <defs>
            <pattern
              id={`planned-pattern-${tooth.fdi_number}`}
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke="#3B82F6" strokeWidth="2" opacity="0.6" />
            </pattern>
          </defs>

          {/* Root Path */}
          <path
            d={paths.rootPath}
            fill={rootFill}
            stroke={rootStroke}
            strokeWidth="1.25"
            className="transition-colors"
          />

          {/* Root Canal Red Line (if endodontically treated) */}
          {hasRootCanal &&
            paths.rootCanalPaths.map((canalD, idx) => (
              <path
                key={`canal-${idx}`}
                d={canalD}
                stroke="#DC2626"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-pulse"
              />
            ))}

          {/* Implant Screw Threads (if implant) */}
          {isImplant &&
            paths.implantThreads?.map((threadD, idx) => (
              <path
                key={`thread-${idx}`}
                d={threadD}
                stroke="#0F766E"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ))}

          {/* Crown Anatomical Shape */}
          <path
            d={paths.crownPath}
            fill={overallStatus === 'planned' ? `url(#planned-pattern-${tooth.fdi_number})` : crownFill}
            stroke={crownStroke}
            strokeWidth={isSelected ? '2.5' : isToothHovered ? '2' : '1.25'}
            strokeDasharray={crownStyle.strokeDasharray}
            className="transition-colors shadow-sm"
          />

          {/* Crown Enamel Fissures */}
          {!isMissing &&
            overallCondition !== 'crown' &&
            paths.fissurePaths?.map((fissureD, idx) => (
              <path
                key={`fissure-${idx}`}
                d={fissureD}
                stroke="#CBD5E1"
                strokeWidth="0.75"
                strokeLinecap="round"
                fill="none"
              />
            ))}

          {/* Missing Tooth Overlay: Red/Gray X Mark */}
          {isMissing && (
            <g stroke="#EF4444" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="18" x2="42" y2="108" />
              <line x1="42" y1="18" x2="12" y2="108" />
            </g>
          )}

          {/* Fractured Overlay: Red/Orange Zigzag Line */}
          {isFractured && (
            <path
              d={tooth.is_upper ? 'M 14 85 L 24 95 L 30 82 L 40 92' : 'M 14 35 L 24 45 L 30 32 L 40 42'}
              stroke="#EF4444"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              className="animate-pulse"
            />
          )}
        </svg>
      </div>

      {/* 3. The 5-Surface Diagram: "الكعكة المربعة" (Square divided into 4 trapezoids + center square) */}
      <div className="mt-1 flex flex-col items-center">
        <svg
          viewBox="0 0 42 42"
          className={`w-9 h-9 sm:w-10 sm:h-10 transition-transform ${isMissing ? 'opacity-30' : ''}`}
        >
          {surfacePolygons.map((poly) => {
            const { condition, status } = getSurfaceCondition(poly.surface);
            const isSurfSelected = isSelected && selectedSurface === poly.surface;
            const isSurfHovered = hoveredSurface === poly.surface;

            return (
              <ToothSurface
                key={poly.surface}
                polygon={poly}
                condition={condition}
                status={status}
                isSelected={isSurfSelected}
                isHovered={isSurfHovered}
                disabled={readOnly || isMissing}
                onClick={(e, surface) => {
                  onToothClick?.(tooth, surface, e);
                }}
                onMouseEnter={(e, surface) => {
                  setHoveredSurface(surface);
                  onToothHover?.(tooth, surface, e);
                }}
                onMouseLeave={() => {
                  setHoveredSurface(null);
                  onToothHover?.(tooth, null);
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* 4. FDI Number badge (placed at bottom for lower arch) */}
      {!tooth.is_upper && (
        <button
          type="button"
          onClick={handleGeneralClick}
          className={`mt-1 px-1.5 py-0.5 rounded text-xs font-bold font-mono transition-colors
            ${
              isSelected
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                : isToothHovered
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }
          `}
          title={`${tooth.name_ar} (#${tooth.fdi_number})`}
        >
          {tooth.fdi_number}
        </button>
      )}

      {/* Status indicator dot if there are pending/planned treatments */}
      {overallStatus === 'planned' && (
        <span
          className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white animate-ping"
          title="إجراء علاجي مخطط له"
        />
      )}
    </div>
  );
};
