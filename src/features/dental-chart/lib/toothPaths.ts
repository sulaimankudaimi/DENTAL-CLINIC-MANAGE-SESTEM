import type { ToothType, ToothSurface } from '@shared/contracts';

/**
 * Geometric 5-surface "الكعكة المربعة" (Square pie / dental 5-surface chart)
 * Coordinates within a 40x40 square [0,0] to [40,40]:
 * - Center square: 12x12 (x: 14 to 26, y: 14 to 26)
 * - Top trapezoid: (0,0) (40,0) (26,14) (14,14)
 * - Bottom trapezoid: (14,26) (26,26) (40,40) (0,40)
 * - Left trapezoid: (0,0) (14,14) (14,26) (0,40)
 * - Right trapezoid: (40,0) (40,40) (26,26) (26,14)
 */
export interface SurfacePolygon {
  surface: ToothSurface;
  label: string;
  labelAr: string;
  points: string;
  textPos: { x: number; y: number };
}

/**
 * Generates the 5 surface polygons for a specific tooth,
 * correctly oriented according to quadrant (Mesial towards midline, Distal away).
 */
export function getSurfacePolygons(
  isUpper: boolean,
  isRight: boolean,
  isAnterior: boolean,
  size: number = 42
): SurfacePolygon[] {
  const inset = Math.round(size * 0.32); // e.g. 13 for 42
  const innerStart = inset;
  const innerEnd = size - inset;

  // Midline is between 11 & 21 (center of mouth).
  // In viewer's perspective:
  // Patient's Right (quadrants 1 & 4) is on the LEFT of the screen.
  // So the midline is to the RIGHT of these teeth.
  // Thus, for Right teeth: Mesial is on the RIGHT, Distal is on the LEFT.
  // For Left teeth (quadrants 2 & 3): Mesial is on the LEFT, Distal is on the RIGHT.
  const mesialIsRight = isRight;

  const mPoints = mesialIsRight
    ? `${size},0 ${size},${size} ${innerEnd},${innerEnd} ${innerEnd},${innerStart}`
    : `0,0 ${innerStart},${innerStart} ${innerStart},${innerEnd} 0,${size}`;

  const dPoints = mesialIsRight
    ? `0,0 ${innerStart},${innerStart} ${innerStart},${innerEnd} 0,${size}`
    : `${size},0 ${size},${size} ${innerEnd},${innerEnd} ${innerEnd},${innerStart}`;

  // For upper jaw: Buccal is Top, Lingual/Palatal is Bottom.
  // For lower jaw: Lingual is Top, Buccal is Bottom.
  const topSurface: ToothSurface = isUpper ? 'B' : 'L';
  const bottomSurface: ToothSurface = isUpper ? 'L' : 'B';

  const topLabel = isUpper ? 'B (دهليزي)' : 'L (لساني)';
  const bottomLabel = isUpper ? 'L (حنكي)' : 'B (دهليزي)';

  const centerLabel = isAnterior ? 'I (قاطع)' : 'O (إطباقي)';

  return [
    // Top surface
    {
      surface: topSurface,
      label: topSurface,
      labelAr: topLabel,
      points: `0,0 ${size},0 ${innerEnd},${innerStart} ${innerStart},${innerStart}`,
      textPos: { x: size / 2, y: innerStart / 2 + 2 },
    },
    // Bottom surface
    {
      surface: bottomSurface,
      label: bottomSurface,
      labelAr: bottomLabel,
      points: `${innerStart},${innerEnd} ${innerEnd},${innerEnd} ${size},${size} 0,${size}`,
      textPos: { x: size / 2, y: size - inset / 2 + 1 },
    },
    // Left surface
    {
      surface: mesialIsRight ? 'D' : 'M',
      label: mesialIsRight ? 'D' : 'M',
      labelAr: mesialIsRight ? 'D (وحشي)' : 'M (إنسي)',
      points: mesialIsRight ? dPoints : mPoints,
      textPos: { x: inset / 2 + 1, y: size / 2 + 2 },
    },
    // Right surface
    {
      surface: mesialIsRight ? 'M' : 'D',
      label: mesialIsRight ? 'M' : 'D',
      labelAr: mesialIsRight ? 'M (إنسي)' : 'D (وحشي)',
      points: mesialIsRight ? mPoints : dPoints,
      textPos: { x: size - inset / 2, y: size / 2 + 2 },
    },
    // Center surface (Occlusal or Incisal)
    {
      surface: 'O',
      label: isAnterior ? 'I' : 'O',
      labelAr: centerLabel,
      points: `${innerStart},${innerStart} ${innerEnd},${innerStart} ${innerEnd},${innerEnd} ${innerStart},${innerEnd}`,
      textPos: { x: size / 2, y: size / 2 + 3 },
    },
  ];
}

/**
 * Anatomical SVG Paths for Crown, Root, Root-Canal, and Cusp contours.
 * Standard viewbox for tooth: 0 0 54 125
 */
export interface AnatomicalToothPaths {
  crownPath: string;
  rootPath: string;
  rootCanalPaths: string[]; // Red lines for endo treatment
  fissurePaths?: string[]; // Natural enamel anatomical grooves
  implantThreads?: string[]; // Screw threads for dental implant
}

// 1. Maxillary (Upper) Teeth: Roots Point UP (y: 6 -> 60), Crown Points DOWN (y: 60 -> 114)
export const UPPER_ANATOMICAL_PATHS: Record<ToothType, AnatomicalToothPaths> = {
  incisor: {
    // Single straight tapering root
    rootPath: 'M 20 62 C 20 40, 24 10, 27 6 C 30 10, 34 40, 34 62 Z',
    rootCanalPaths: ['M 27 10 L 27 62'],
    // Wide spatula/chisel-like flat crown with rounded corners
    crownPath:
      'M 19 62 C 16 75, 14 96, 15 110 C 18 114, 36 114, 39 110 C 40 96, 38 75, 35 62 C 30 65, 24 65, 19 62 Z',
    fissurePaths: ['M 23 80 L 23 104', 'M 31 80 L 31 104'],
    implantThreads: [
      'M 18 20 L 36 20',
      'M 19 28 L 35 28',
      'M 20 36 L 34 36',
      'M 22 44 L 32 44',
      'M 24 52 L 30 52',
    ],
  },
  canine: {
    // Very long sturdy conical root
    rootPath: 'M 19 62 C 19 36, 23 6, 27 4 C 31 6, 35 36, 35 62 Z',
    rootCanalPaths: ['M 27 7 L 27 62'],
    // Conical pointed crown with sharp cusp tip
    crownPath:
      'M 18 62 C 14 76, 13 95, 17 105 C 22 112, 27 118, 27 118 C 27 118, 32 112, 37 105 C 41 95, 40 76, 36 62 C 31 64, 23 64, 18 62 Z',
    fissurePaths: ['M 27 75 L 27 112'],
    implantThreads: [
      'M 18 18 L 36 18',
      'M 19 26 L 35 26',
      'M 20 34 L 34 34',
      'M 21 42 L 33 42',
      'M 23 50 L 31 50',
    ],
  },
  premolar: {
    // Dual tapering root (buccal + palatal)
    rootPath:
      'M 19 62 C 18 42, 20 18, 23 8 C 25 18, 26 38, 27 45 C 28 38, 29 18, 31 8 C 34 18, 36 42, 35 62 Z',
    rootCanalPaths: ['M 23 12 L 25 60', 'M 31 12 L 29 60'],
    // Bicuspid crown (two rounded cusps)
    crownPath:
      'M 17 62 C 14 74, 13 94, 18 108 C 22 112, 25 110, 27 106 C 29 110, 32 112, 36 108 C 41 94, 40 74, 37 62 C 32 65, 22 65, 17 62 Z',
    fissurePaths: ['M 22 84 L 32 84', 'M 27 76 L 27 96'],
    implantThreads: [
      'M 17 22 L 37 22',
      'M 18 30 L 36 30',
      'M 19 38 L 35 38',
      'M 21 46 L 33 46',
      'M 23 54 L 31 54',
    ],
  },
  molar: {
    // Upper molar with 3 roots! (Mesiobuccal, Distobuccal, and Palatal root in between)
    rootPath:
      'M 14 62 C 13 40, 11 18, 14 7 C 18 18, 22 38, 24 48 C 25 36, 25 14, 27 5 C 29 14, 29 36, 30 48 C 32 38, 36 18, 40 7 C 43 18, 41 40, 40 62 Z',
    rootCanalPaths: ['M 14 12 L 22 60', 'M 27 8 L 27 60', 'M 40 12 L 32 60'],
    // Wide multicuspal crown (Rhomboid anatomical table)
    crownPath:
      'M 13 62 C 9 74, 9 96, 13 108 C 17 113, 23 111, 27 107 C 31 111, 37 113, 41 108 C 45 96, 45 74, 41 62 C 34 65, 20 65, 13 62 Z',
    fissurePaths: [
      'M 18 80 Q 27 85 36 80',
      'M 27 74 L 27 98',
      'M 20 95 L 34 95',
    ],
    implantThreads: [
      'M 15 20 L 39 20',
      'M 16 28 L 38 28',
      'M 17 36 L 37 36',
      'M 19 44 L 35 44',
      'M 22 52 L 32 52',
    ],
  },
};

// 2. Mandibular (Lower) Teeth: Crown on TOP (y: 12 -> 62), Roots Point DOWN (y: 62 -> 118)
export const LOWER_ANATOMICAL_PATHS: Record<ToothType, AnatomicalToothPaths> = {
  incisor: {
    // Narrow chisel crown
    crownPath:
      'M 20 62 C 16 48, 16 26, 18 14 C 22 10, 32 10, 36 14 C 38 26, 38 48, 34 62 C 30 60, 24 60, 20 62 Z',
    fissurePaths: ['M 24 22 L 24 46', 'M 30 22 L 30 46'],
    // Slender single root
    rootPath: 'M 21 62 C 21 82, 25 112, 27 118 C 29 112, 33 82, 33 62 Z',
    rootCanalPaths: ['M 27 62 L 27 114'],
    implantThreads: [
      'M 22 72 L 32 72',
      'M 21 80 L 33 80',
      'M 20 88 L 34 88',
      'M 19 96 L 35 96',
      'M 18 104 L 36 104',
    ],
  },
  canine: {
    // Conical pointed crown pointing up
    crownPath:
      'M 18 62 C 15 48, 14 28, 18 18 C 22 12, 27 6, 27 6 C 27 6, 32 12, 36 18 C 40 28, 39 48, 36 62 C 31 60, 23 60, 18 62 Z',
    fissurePaths: ['M 27 12 L 27 50'],
    // Long sturdy root pointing down
    rootPath: 'M 20 62 C 20 84, 24 116, 27 120 C 30 116, 34 84, 34 62 Z',
    rootCanalPaths: ['M 27 62 L 27 116'],
    implantThreads: [
      'M 22 74 L 32 74',
      'M 21 82 L 33 82',
      'M 20 90 L 34 90',
      'M 19 98 L 35 98',
      'M 18 106 L 36 106',
    ],
  },
  premolar: {
    // Bicuspid crown
    crownPath:
      'M 17 62 C 14 50, 13 30, 18 16 C 22 12, 25 14, 27 18 C 29 14, 32 12, 36 16 C 41 30, 40 50, 37 62 C 32 60, 22 60, 17 62 Z',
    fissurePaths: ['M 22 38 L 32 38', 'M 27 28 L 27 48'],
    // Single tapering root
    rootPath: 'M 20 62 C 19 82, 23 112, 27 118 C 31 112, 35 82, 34 62 Z',
    rootCanalPaths: ['M 27 62 L 27 114'],
    implantThreads: [
      'M 22 72 L 32 72',
      'M 21 80 L 33 80',
      'M 20 88 L 34 88',
      'M 19 96 L 35 96',
      'M 18 104 L 36 104',
    ],
  },
  molar: {
    // Lower molar multicusp crown (5 cusps)
    crownPath:
      'M 13 62 C 9 50, 9 28, 13 16 C 17 11, 23 13, 27 17 C 31 13, 37 11, 41 16 C 45 28, 45 50, 41 62 C 34 60, 20 60, 13 62 Z',
    fissurePaths: [
      'M 18 42 Q 27 38 36 42',
      'M 27 24 L 27 48',
      'M 20 28 L 34 28',
    ],
    // Lower molar has TWO bifurcated curved roots (Mesial & Distal)
    rootPath:
      'M 15 62 C 13 80, 14 104, 18 116 C 22 104, 23 88, 25 76 C 27 76, 29 76, 31 76 C 33 88, 34 104, 38 116 C 42 104, 43 80, 41 62 Z',
    rootCanalPaths: ['M 22 62 L 18 112', 'M 34 62 L 38 112'],
    implantThreads: [
      'M 22 72 L 34 72',
      'M 20 80 L 36 80',
      'M 18 88 L 38 88',
      'M 17 96 L 39 96',
      'M 16 104 L 40 104',
    ],
  },
};

export function getAnatomicalPaths(
  type: ToothType,
  isUpper: boolean
): AnatomicalToothPaths {
  return isUpper ? UPPER_ANATOMICAL_PATHS[type] : LOWER_ANATOMICAL_PATHS[type];
}
