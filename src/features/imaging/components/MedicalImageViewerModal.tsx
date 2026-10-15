import React, { useState, useEffect, useRef } from 'react';
import type { Image } from '@shared/contracts';
import { IMAGE_TYPE_AR } from '@shared/contracts';
import { formatDateAr } from '@/lib/formatters';
import { useMediaUrl } from '@/lib/useMediaUrl';
import { saveAnnotations, loadAnnotations } from '@/lib/mediaStorage';
import { useToast } from '@/components/ui/Toast';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Sliders,
  Ruler,
  MousePointer,
  ArrowUpRight,
  Circle,
  Type,
  Trash2,
  Undo2,
  Save,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  X,
  SplitSquareVertical,
} from 'lucide-react';
import type {
  AnnotationItem,
  AnnotationType,
  ImageAnnotationsLayer,
  ImageAdjustmentFilters,
} from '../types';
import { DEFAULT_ADJUSTMENTS } from '../types';

interface MedicalImageViewerModalProps {
  image: Image | null;
  patientName?: string;
  allPatientImages?: Image[];
  isOpen: boolean;
  onClose: () => void;
  onOpenComparison?: (baseImage: Image, targetImage?: Image) => void;
}

export const MedicalImageViewerModal: React.FC<MedicalImageViewerModalProps> = ({
  image,
  patientName,
  isOpen,
  onClose,
  onOpenComparison,
}) => {
  const { toast } = useToast();
  const { url: mediaUrl } = useMediaUrl(image?.file_path || image?.thumbnail_path);

  // Filters & Transforms
  const [filters, setFilters] = useState<ImageAdjustmentFilters>(DEFAULT_ADJUSTMENTS);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Annotations & Tools
  const [activeTool, setActiveTool] = useState<AnnotationType | 'select'>('select');
  const [annotationColor, setAnnotationColor] = useState<string>('#ef4444'); // default red
  const strokeWidth = 3;
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [calibrationMmPerPx, setCalibrationMmPerPx] = useState<number>(0.1);
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);

  // Drawing state
  const [drawingAnnotation, setDrawingAnnotation] = useState<AnnotationItem | null>(null);
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);
  const [textInputValue, setTextInputValue] = useState('');

  // UI state
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);

  // Load annotations JSON layer when image changes
  useEffect(() => {
    if (!image) return;
    setFilters(DEFAULT_ADJUSTMENTS);
    setPanOffset({ x: 0, y: 0 });
    setActiveTool('select');
    setTextInputPos(null);

    loadAnnotations<ImageAnnotationsLayer>(image.id).then((saved) => {
      if (saved && Array.isArray(saved.annotations)) {
        setAnnotations(saved.annotations);
        if (saved.calibrationMmPerPx) {
          setCalibrationMmPerPx(saved.calibrationMmPerPx);
        }
      } else {
        setAnnotations([]);
      }
    });
  }, [image]);

  // Handle Save Annotations layer as separate JSON
  const handleSaveAnnotations = async () => {
    if (!image) return;
    const layer: ImageAnnotationsLayer = {
      imageId: image.id,
      patientId: image.patient_id,
      calibrationMmPerPx,
      annotations,
      updatedAt: new Date().toISOString(),
    };

    await saveAnnotations(image.id, layer);
    toast({
      title: 'تم حفظ طبقة التعليقات والقياسات',
      description: 'حُفظت التعليقات كطبقة JSON منفصلة تماماً دون المساس بالصورة الأصلية.',
      variant: 'success',
    });
  };

  // Coordinates helper (translates client click to 0-100% relative coordinates)
  const getRelativeCoords = (e: React.MouseEvent) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  // Drawing event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // left click only

    if (activeTool === 'select') {
      if (filters.zoom > 1) {
        setIsDraggingPan(true);
        dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      }
      return;
    }

    const { x, y } = getRelativeCoords(e);

    if (activeTool === 'text') {
      setTextInputPos({ x, y });
      setTextInputValue('');
      return;
    }

    // Arrow, Circle, Rect, Ruler
    const newAnnotation: AnnotationItem = {
      id: crypto.randomUUID(),
      type: activeTool,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      color: annotationColor,
      strokeWidth,
    };
    setDrawingAnnotation(newAnnotation);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingPan) {
      setPanOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
      return;
    }

    if (!drawingAnnotation) return;
    const { x, y } = getRelativeCoords(e);
    
    // Calculate length in mm if ruler
    let lengthMm: number | undefined;
    if (drawingAnnotation.type === 'ruler' && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const pxX = ((x - drawingAnnotation.startX) / 100) * rect.width;
      const pxY = ((y - drawingAnnotation.startY) / 100) * rect.height;
      const pixelDist = Math.sqrt(pxX * pxX + pxY * pxY) / filters.zoom;
      lengthMm = Number((pixelDist * calibrationMmPerPx).toFixed(1));
    }

    setDrawingAnnotation({
      ...drawingAnnotation,
      endX: x,
      endY: y,
      lengthMm,
    });
  };

  const handleMouseUp = () => {
    if (isDraggingPan) {
      setIsDraggingPan(false);
      return;
    }

    if (drawingAnnotation) {
      const dist = Math.hypot(
        drawingAnnotation.endX - drawingAnnotation.startX,
        drawingAnnotation.endY - drawingAnnotation.startY
      );
      if (dist > 1) {
        setAnnotations((prev) => [...prev, drawingAnnotation]);
      }
      setDrawingAnnotation(null);
    }
  };

  const handleAddTextAnnotation = () => {
    if (!textInputPos || !textInputValue.trim()) {
      setTextInputPos(null);
      return;
    }

    const newAnnot: AnnotationItem = {
      id: crypto.randomUUID(),
      type: 'text',
      startX: textInputPos.x,
      startY: textInputPos.y,
      endX: textInputPos.x,
      endY: textInputPos.y,
      color: annotationColor,
      strokeWidth: 1,
      text: textInputValue.trim(),
    };

    setAnnotations((prev) => [...prev, newAnnot]);
    setTextInputPos(null);
    setTextInputValue('');
  };

  const handleUndo = () => {
    setAnnotations((prev) => prev.slice(0, -1));
  };

  const handleClearAnnotations = () => {
    if (annotations.length === 0) return;
    if (confirm('هل أنت متأكد من مسح جميع التعليقات والقياسات الحالية؟')) {
      setAnnotations([]);
    }
  };

  // Reset transforms & filters
  const handleResetFilters = () => {
    setFilters(DEFAULT_ADJUSTMENTS);
    setPanOffset({ x: 0, y: 0 });
  };

  // Keyboard shortcut listener for Esc / Zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (textInputPos) {
          setTextInputPos(null);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, textInputPos, isFullscreen, onClose]);

  if (!isOpen || !image) return null;

  // Render transformed image styles
  const imageTransform = `
    scale(${filters.zoom})
    translate(${panOffset.x / filters.zoom}px, ${panOffset.y / filters.zoom}px)
    rotate(${filters.rotation}deg)
    scaleX(${filters.flipH ? -1 : 1})
    scaleY(${filters.flipV ? -1 : 1})
  `;

  const imageFilter = `
    brightness(${filters.brightness}%)
    contrast(${filters.contrast}%)
    ${filters.invert ? 'invert(100%)' : ''}
  `;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col bg-slate-950/95 text-slate-100 backdrop-blur-md transition-all select-none ${
        isFullscreen ? 'p-0' : 'p-3 sm:p-6'
      }`}
    >
      {/* Modal Dialog Content Container */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/90 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2.5 py-1 rounded-md bg-brand-blue/20 text-brand-blue border border-brand-blue/30 text-xs font-bold">
              {IMAGE_TYPE_AR[image.type] || image.type}
            </span>
            {image.tooth_number && (
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                سن #{image.tooth_number}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {image.notes || `صورة أشعة سريرية`}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>{formatDateAr(image.taken_at)}</span>
                {patientName && <span>• المريض: {patientName}</span>}
                {image.tags && image.tags.length > 0 && (
                  <span className="text-slate-300">• {image.tags.join('، ')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenComparison && (
              <button
                type="button"
                onClick={() => onOpenComparison(image)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                title="فتح وضع المقارنة (قبل / بعد)"
              >
                <SplitSquareVertical className="w-4 h-4 text-brand-blue" />
                <span className="hidden sm:inline">مقارنة</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAnnotations}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition-colors"
              title="حفظ التعليقات والقياسات كطبقة JSON منفصلة"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">حفظ التعليقات</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isFullscreen ? 'تصغير' : 'ملء الشاشة'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Work Area: Toolbar on Top / Image Viewport in Center */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Main Inspection Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900/60 text-xs">
            {/* Left Controls: Zoom, Rotate, Flip */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Tool selector */}
              <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveTool('select')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                    activeTool === 'select'
                      ? 'bg-brand-blue text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="مؤشر السحب والتصفح"
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>تصفح</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('ruler')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                    activeTool === 'ruler'
                      ? 'bg-brand-blue text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="مسطرة قياس المسافات السريرية (مم)"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>مسطرة قياس</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('arrow')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                    activeTool === 'arrow'
                      ? 'bg-brand-blue text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="سهم إشارة للتشخيص"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>سهم</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('circle')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                    activeTool === 'circle'
                      ? 'bg-brand-blue text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="تحديد دائري للمنطقة المصابة"
                >
                  <Circle className="w-3.5 h-3.5" />
                  <span>دائرة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('text')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                    activeTool === 'text'
                      ? 'bg-brand-blue text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="إضافة ملاحظة نصية"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>نص</span>
                </button>
              </div>

              {/* Color & Style Palette when annotating */}
              {activeTool !== 'select' && (
                <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
                  {['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#ffffff'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAnnotationColor(c)}
                      className={`w-4 h-4 rounded-full border-2 transition-transform ${
                        annotationColor === c ? 'scale-125 border-white' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                      title={`لون: ${c}`}
                    />
                  ))}
                  {activeTool === 'ruler' && (
                    <button
                      type="button"
                      onClick={() => setShowCalibrationDialog(true)}
                      className="px-1.5 py-0.5 text-[11px] rounded bg-slate-700 hover:bg-slate-600 text-amber-300 mr-1"
                      title="معايرة المقياس"
                    >
                      معايرة: {calibrationMmPerPx} مم/بكسل
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Controls: Zoom, Rotate, Filters, Layers */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Zoom Buttons */}
              <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, zoom: Math.min(4, +(f.zoom + 0.25).toFixed(2)) }))}
                  className="p-1.5 text-slate-300 hover:text-white rounded"
                  title="تكبير"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono text-[11px] text-slate-300">
                  {Math.round(filters.zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, zoom: Math.max(0.5, +(f.zoom - 0.25).toFixed(2)) }))}
                  className="p-1.5 text-slate-300 hover:text-white rounded"
                  title="تصغير"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>

              {/* Rotate & Flip */}
              <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, rotation: (f.rotation - 90 + 360) % 360 }))}
                  className="p-1.5 text-slate-300 hover:text-white rounded"
                  title="تدوير عكس عقارب الساعة"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, rotation: (f.rotation + 90) % 360 }))}
                  className="p-1.5 text-slate-300 hover:text-white rounded"
                  title="تدوير مع عقارب الساعة"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, flipH: !f.flipH }))}
                  className={`p-1.5 rounded ${filters.flipH ? 'text-brand-blue bg-slate-700' : 'text-slate-300 hover:text-white'}`}
                  title="قلب أفقي"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, flipV: !f.flipV }))}
                  className={`p-1.5 rounded ${filters.flipV ? 'text-brand-blue bg-slate-700' : 'text-slate-300 hover:text-white'}`}
                  title="قلب عمودي"
                >
                  <FlipVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Invert Negative X-Ray Toggle */}
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, invert: !f.invert }))}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                  filters.invert
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="عكس الألوان (صورة سلبية للأشعة السينية)"
              >
                <Sun className="w-3.5 h-3.5" />
                <span>سلبية X-Ray</span>
              </button>

              {/* Adjustments (Brightness / Contrast) toggle */}
              <button
                type="button"
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                  showFiltersPanel
                    ? 'bg-brand-blue text-white border-brand-blue'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="تعديل السطوع والتباين"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>السطوع والتباين</span>
              </button>

              {/* Annotations visibility toggle */}
              <button
                type="button"
                onClick={() => setShowAnnotations(!showAnnotations)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  showAnnotations
                    ? 'bg-slate-800 text-emerald-400 border-slate-700'
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
                title={showAnnotations ? 'إخفاء طبقة التعليقات' : 'إظهار طبقة التعليقات'}
              >
                {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              {/* Undo and Clear */}
              {annotations.length > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                    title="تراجع عن آخر تعليق"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAnnotations}
                    className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:text-rose-300 border border-slate-700"
                    title="مسح كافة التعليقات"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Reset button */}
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700"
                title="إعادة ضبط العرض"
              >
                إعادة ضبط
              </button>
            </div>
          </div>

          {/* Adjustments Popup Panel (Brightness & Contrast Sliders) */}
          {showFiltersPanel && (
            <div className="absolute top-12 left-4 z-30 w-72 p-4 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl backdrop-blur-md space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200">معايرة السطوع والتباين (CSS Filters)</span>
                <button
                  type="button"
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      brightness: 100,
                      contrast: 100,
                    }))
                  }
                  className="text-slate-400 hover:text-brand-blue"
                >
                  استعادة
                </button>
              </div>

              {/* Brightness slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>السطوع (Brightness)</span>
                  <span className="font-mono">{filters.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={filters.brightness}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, brightness: Number(e.target.value) }))
                  }
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                />
              </div>

              {/* Contrast slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>التباين (Contrast)</span>
                  <span className="font-mono">{filters.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={filters.contrast}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, contrast: Number(e.target.value) }))
                  }
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                />
              </div>
            </div>
          )}

          {/* Calibration Dialog */}
          {showCalibrationDialog && (
            <div className="absolute top-12 right-4 z-30 w-72 p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-xl space-y-3 text-xs">
              <span className="font-bold text-slate-200 block">معايرة مسطرة القياس</span>
              <p className="text-slate-400">
                حدد مقياس التحويل من البكسل إلى المليمتر (مم/بكسل). القيمة القياسية للأشعة هي ~0.1 مم.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="5"
                  value={calibrationMmPerPx}
                  onChange={(e) => setCalibrationMmPerPx(Number(e.target.value))}
                  className="w-24 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-mono"
                />
                <span className="text-slate-400">مم لكل بكسل</span>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCalibrationDialog(false)}
                  className="px-3 py-1 rounded bg-brand-blue text-white"
                >
                  تم
                </button>
              </div>
            </div>
          )}

          {/* Image Viewport Container */}
          <div
            className={`flex-1 relative overflow-hidden bg-black flex items-center justify-center p-4 ${
              activeTool === 'select'
                ? filters.zoom > 1
                  ? 'cursor-grab active:cursor-grabbing'
                  : 'cursor-default'
                : 'cursor-crosshair'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* The Image Element & Overlay Wrapper */}
            <div
              className="relative inline-block max-w-full max-h-full transition-transform duration-75 select-none"
              style={{
                transform: imageTransform,
                filter: imageFilter,
              }}
            >
              <img
                ref={imageRef}
                src={mediaUrl || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80'}
                alt={image.notes || 'Dental X-Ray'}
                className="max-h-[75vh] max-w-[85vw] object-contain rounded-sm pointer-events-none"
                draggable={false}
              />

              {/* Separate Annotation & Measurement SVG Layer */}
              {showAnnotations && (
                <svg
                  ref={overlayRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <marker
                      id="arrowhead-red"
                      markerWidth="6"
                      markerHeight="6"
                      refX="5"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
                    </marker>
                    <marker
                      id="arrowhead-yellow"
                      markerWidth="6"
                      markerHeight="6"
                      refX="5"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 6 3, 0 6" fill="#f59e0b" />
                    </marker>
                    <marker
                      id="arrowhead-cyan"
                      markerWidth="6"
                      markerHeight="6"
                      refX="5"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 6 3, 0 6" fill="#06b6d4" />
                    </marker>
                    <marker
                      id="arrowhead-white"
                      markerWidth="6"
                      markerHeight="6"
                      refX="5"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 6 3, 0 6" fill="#ffffff" />
                    </marker>
                  </defs>

                  {/* Render Saved Annotations */}
                  {annotations.map((annot) => {
                    if (annot.type === 'arrow') {
                      return (
                        <line
                          key={annot.id}
                          x1={annot.startX}
                          y1={annot.startY}
                          x2={annot.endX}
                          y2={annot.endY}
                          stroke={annot.color}
                          strokeWidth={annot.strokeWidth * 0.4}
                          markerEnd="url(#arrowhead-red)"
                        />
                      );
                    }

                    if (annot.type === 'circle') {
                      const rx = Math.abs(annot.endX - annot.startX) / 2;
                      const ry = Math.abs(annot.endY - annot.startY) / 2;
                      const cx = (annot.startX + annot.endX) / 2;
                      const cy = (annot.startY + annot.endY) / 2;
                      return (
                        <ellipse
                          key={annot.id}
                          cx={cx}
                          cy={cy}
                          rx={rx}
                          ry={ry}
                          stroke={annot.color}
                          strokeWidth={annot.strokeWidth * 0.4}
                          fill="none"
                          strokeDasharray="4 2"
                        />
                      );
                    }

                    if (annot.type === 'ruler') {
                      const midX = (annot.startX + annot.endX) / 2;
                      const midY = (annot.startY + annot.endY) / 2;
                      return (
                        <g key={annot.id}>
                          <line
                            x1={annot.startX}
                            y1={annot.startY}
                            x2={annot.endX}
                            y2={annot.endY}
                            stroke={annot.color}
                            strokeWidth={annot.strokeWidth * 0.5}
                          />
                          {/* End Ticks */}
                          <circle cx={annot.startX} cy={annot.startY} r="0.8" fill={annot.color} />
                          <circle cx={annot.endX} cy={annot.endY} r="0.8" fill={annot.color} />
                          {/* Ruler Label */}
                          <rect
                            x={midX - 4}
                            y={midY - 2.5}
                            width="8"
                            height="3.5"
                            rx="0.5"
                            fill="#0f172a"
                            fillOpacity="0.8"
                          />
                          <text
                            x={midX}
                            y={midY - 0.5}
                            fill="#ffffff"
                            fontSize="2"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            {annot.lengthMm ? `${annot.lengthMm} mm` : ''}
                          </text>
                        </g>
                      );
                    }

                    if (annot.type === 'text' && annot.text) {
                      return (
                        <g key={annot.id}>
                          <rect
                            x={annot.startX - 1}
                            y={annot.startY - 3}
                            width={Math.max(12, annot.text.length * 2)}
                            height="4.5"
                            rx="0.5"
                            fill="#0f172a"
                            fillOpacity="0.85"
                            stroke={annot.color}
                            strokeWidth="0.3"
                          />
                          <text
                            x={annot.startX + 1}
                            y={annot.startY - 0.5}
                            fill="#ffffff"
                            fontSize="2.4"
                            fontWeight="bold"
                            dominantBaseline="middle"
                          >
                            {annot.text}
                          </text>
                        </g>
                      );
                    }

                    return null;
                  })}

                  {/* Render Current In-Progress Drawing */}
                  {drawingAnnotation && (
                    <>
                      {drawingAnnotation.type === 'arrow' && (
                        <line
                          x1={drawingAnnotation.startX}
                          y1={drawingAnnotation.startY}
                          x2={drawingAnnotation.endX}
                          y2={drawingAnnotation.endY}
                          stroke={drawingAnnotation.color}
                          strokeWidth={drawingAnnotation.strokeWidth * 0.4}
                        />
                      )}
                      {drawingAnnotation.type === 'circle' && (
                        <ellipse
                          cx={(drawingAnnotation.startX + drawingAnnotation.endX) / 2}
                          cy={(drawingAnnotation.startY + drawingAnnotation.endY) / 2}
                          rx={Math.abs(drawingAnnotation.endX - drawingAnnotation.startX) / 2}
                          ry={Math.abs(drawingAnnotation.endY - drawingAnnotation.startY) / 2}
                          stroke={drawingAnnotation.color}
                          strokeWidth={drawingAnnotation.strokeWidth * 0.4}
                          fill="none"
                          strokeDasharray="4 2"
                        />
                      )}
                      {drawingAnnotation.type === 'ruler' && (
                        <g>
                          <line
                            x1={drawingAnnotation.startX}
                            y1={drawingAnnotation.startY}
                            x2={drawingAnnotation.endX}
                            y2={drawingAnnotation.endY}
                            stroke={drawingAnnotation.color}
                            strokeWidth={drawingAnnotation.strokeWidth * 0.5}
                          />
                          <circle cx={drawingAnnotation.startX} cy={drawingAnnotation.startY} r="0.8" fill={drawingAnnotation.color} />
                          <circle cx={drawingAnnotation.endX} cy={drawingAnnotation.endY} r="0.8" fill={drawingAnnotation.color} />
                          {drawingAnnotation.lengthMm !== undefined && (
                            <text
                              x={(drawingAnnotation.startX + drawingAnnotation.endX) / 2}
                              y={(drawingAnnotation.startY + drawingAnnotation.endY) / 2 - 1.5}
                              fill="#ffffff"
                              fontSize="2.4"
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {drawingAnnotation.lengthMm} mm
                            </text>
                          )}
                        </g>
                      )}
                    </>
                  )}
                </svg>
              )}

              {/* Text Input Prompt when placing text note */}
              {textInputPos && (
                <div
                  className="absolute z-40 bg-slate-900 border border-brand-blue p-2 rounded-lg shadow-xl"
                  style={{
                    left: `${textInputPos.x}%`,
                    top: `${textInputPos.y}%`,
                    transform: 'translate(-50%, -100%)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="أدخل الملاحظة السريرية..."
                      value={textInputValue}
                      onChange={(e) => setTextInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTextAnnotation();
                        if (e.key === 'Escape') setTextInputPos(null);
                      }}
                      className="px-2 py-1 text-xs rounded bg-slate-800 border border-slate-700 text-white outline-none w-48"
                    />
                    <button
                      type="button"
                      onClick={handleAddTextAnnotation}
                      className="px-2 py-1 text-xs bg-brand-blue hover:bg-blue-600 text-white rounded font-medium"
                    >
                      إضافة
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextInputPos(null)}
                      className="p-1 text-xs text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info / quick thumbnails row */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-4">
            <span>
              مسار التخزين الآمن: <code className="text-slate-300 font-mono">{image.file_path}</code>
            </span>
            <span>• عدد التعليقات: {annotations.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              العارض الطبي المتقدم • عيادتي دنتال
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
