export type AnnotationType = 'arrow' | 'circle' | 'rect' | 'text' | 'ruler';

export interface AnnotationItem {
  id: string;
  type: AnnotationType;
  startX: number; // percentage (0-100) or pixel coordinates relative to image natural size
  startY: number;
  endX: number;
  endY: number;
  color: string;
  strokeWidth: number;
  text?: string;
  lengthMm?: number;
}

export interface ImageAnnotationsLayer {
  imageId: string;
  patientId?: string;
  calibrationMmPerPx: number; // default e.g. 0.1 mm per pixel
  annotations: AnnotationItem[];
  updatedAt: string;
}

export type ComparisonMode = 'side-by-side' | 'slider';

export interface ImageAdjustmentFilters {
  brightness: number; // 50 to 200 (100 is default)
  contrast: number;   // 50 to 200 (100 is default)
  invert: boolean;    // negative x-ray mode
  zoom: number;       // 0.5 to 4
  rotation: number;   // 0, 90, 180, 270
  flipH: boolean;     // horizontal flip
  flipV: boolean;     // vertical flip
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustmentFilters = {
  brightness: 100,
  contrast: 100,
  invert: false,
  zoom: 1,
  rotation: 0,
  flipH: false,
  flipV: false,
};

export const COMMON_DENTAL_TAGS = [
  'قبل العلاج',
  'بعد العلاج',
  'أثناء المعالجة',
  'تسوس عميق',
  'معالجة لبية (عصب)',
  'زراعة أسنان',
  'تقويم أسنان',
  'خلع جراحي',
  'تركيبة / تاج',
  'انحشار سن عقل',
  'طوارئ',
  'متابعة دورية',
];
