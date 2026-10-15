import React from 'react';
import type { ToothSurface as ToothSurfaceType, ToothCondition, ToothRecordStatus } from '@shared/contracts';
import type { SurfacePolygon } from '../lib/toothPaths';
import { getConditionStyle } from '../lib/conditionColors';

export interface ToothSurfaceProps {
  polygon: SurfacePolygon;
  condition?: ToothCondition;
  status?: ToothRecordStatus;
  isSelected?: boolean;
  isHovered?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent, surface: ToothSurfaceType) => void;
  onMouseEnter?: (e: React.MouseEvent, surface: ToothSurfaceType) => void;
  onMouseLeave?: () => void;
}

export const ToothSurface: React.FC<ToothSurfaceProps> = ({
  polygon,
  condition = 'healthy',
  status = 'existing',
  isSelected = false,
  isHovered = false,
  disabled = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const style = getConditionStyle(condition, status);

  // Surface fill logic:
  // If healthy: #FFFFFF with #C9D6E6 border
  // If hovered or selected, apply highlight
  let fill = style.fill;
  let stroke = style.stroke;
  let strokeWidth = style.strokeWidth;

  if (isSelected) {
    stroke = '#2563EB'; // Vibrant blue highlight
    strokeWidth = 2.5;
  } else if (isHovered) {
    stroke = '#3B82F6';
    strokeWidth = 2;
  }

  const isCenter = polygon.surface === 'O';

  return (
    <g
      className={`transition-colors duration-150 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={(e) => {
        if (disabled) return;
        e.stopPropagation();
        onClick?.(e, polygon.surface);
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        onMouseEnter?.(e, polygon.surface);
      }}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`${polygon.labelAr}: ${condition}`}
    >
      <polygon
        points={polygon.points}
        fill={fill}
        fillOpacity={isHovered ? Math.min(1, style.fillOpacity + 0.15) : style.fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={style.strokeDasharray}
        strokeLinejoin="round"
        className="transition-all duration-150"
      />

      {/* Surface label letter (B, L, M, D, O/I) */}
      <text
        x={polygon.textPos.x}
        y={polygon.textPos.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={isCenter ? 9 : 7.5}
        fontWeight={isSelected || isHovered ? 700 : 500}
        fill={
          condition !== 'healthy' && condition !== 'missing'
            ? '#FFFFFF'
            : isSelected
            ? '#1D4ED8'
            : isHovered
            ? '#2563EB'
            : '#64748B'
        }
        pointerEvents="none"
        className="select-none font-mono"
      >
        {polygon.label}
      </text>
    </g>
  );
};

