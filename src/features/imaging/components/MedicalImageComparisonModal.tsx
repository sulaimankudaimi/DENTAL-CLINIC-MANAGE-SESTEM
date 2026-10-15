import React, { useState, useRef, useEffect } from 'react';
import type { Image } from '@shared/contracts';
import { IMAGE_TYPE_AR } from '@shared/contracts';
import { formatDateAr } from '@/lib/formatters';
import { useMediaUrl } from '@/lib/useMediaUrl';
import {
  Columns2,
  SplitSquareVertical,
  X,
  ZoomIn,
  ZoomOut,
  Sun,
  ArrowRightLeft,
} from 'lucide-react';
import type { ComparisonMode } from '../types';

interface MedicalImageComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseImage: Image | null;
  targetImage?: Image | null;
  patientImages: Image[];
  patientName?: string;
}

export const MedicalImageComparisonModal: React.FC<MedicalImageComparisonModalProps> = ({
  isOpen,
  onClose,
  baseImage,
  targetImage,
  patientImages,
  patientName,
}) => {
  const [mode, setMode] = useState<ComparisonMode>('slider');
  const [imgLeft, setImgLeft] = useState<Image | null>(baseImage);
  const [imgRight, setImgRight] = useState<Image | null>(
    targetImage || patientImages.find((i) => i.id !== baseImage?.id) || null
  );

  const [zoom, setZoom] = useState<number>(1);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [invert, setInvert] = useState<boolean>(false);

  // Split Slider state
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0-100
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // Media URLs
  const { url: urlLeft } = useMediaUrl(imgLeft?.file_path || imgLeft?.thumbnail_path);
  const { url: urlRight } = useMediaUrl(imgRight?.file_path || imgRight?.thumbnail_path);

  useEffect(() => {
    if (baseImage) setImgLeft(baseImage);
    if (targetImage) {
      setImgRight(targetImage);
    } else if (baseImage && patientImages.length > 1) {
      const other = patientImages.find((i) => i.id !== baseImage.id);
      if (other) setImgRight(other);
    }
  }, [baseImage, targetImage, patientImages]);

  // Handle slider drag
  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  };

  const handleMouseDownSlider = () => {
    setIsDraggingSlider(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider) {
        handleSliderMove(e.clientX);
      }
    };
    const handleMouseUp = () => {
      if (isDraggingSlider) {
        setIsDraggingSlider(false);
      }
    };

    if (isDraggingSlider) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSlider]);

  // Swap Left and Right
  const handleSwap = () => {
    const temp = imgLeft;
    setImgLeft(imgRight);
    setImgRight(temp);
  };

  if (!isOpen || !imgLeft) return null;

  const filterStyle = `
    brightness(${brightness}%)
    contrast(${contrast}%)
    ${invert ? 'invert(100%)' : ''}
  `;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 text-slate-100 p-2 sm:p-5 select-none">
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/90 gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-brand-blue/20 text-brand-blue border border-brand-blue/30">
              <SplitSquareVertical className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                مقارنة الأشعة السريرية
                {patientName && <span className="text-xs text-slate-400 font-normal">({patientName})</span>}
              </h2>
              <p className="text-xs text-slate-400">
                مقارنة التطور السريري ونتائج المعالجة (قبل / بعد)
              </p>
            </div>
          </div>

          {/* Mode Switcher & Actions */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setMode('slider')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  mode === 'slider'
                    ? 'bg-brand-blue text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span>شريط تمرير (قبل/بعد)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('side-by-side')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  mode === 'side-by-side'
                    ? 'bg-brand-blue text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>جنباً إلى جنب</span>
              </button>
            </div>

            {/* Swap button */}
            <button
              type="button"
              onClick={handleSwap}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors"
              title="تبديل موقع الصورتين"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-brand-blue" />
              <span className="hidden sm:inline">تبديل</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Adjustments, Zoom, and Image Selector Pickers */}
        <div className="flex flex-wrap items-center justify-between px-5 py-2 border-b border-slate-800 bg-slate-900/60 text-xs gap-3">
          {/* Selectors for Left & Right Images */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-xs">الصورة 1 (قبل):</span>
              <select
                value={imgLeft.id}
                onChange={(e) => {
                  const sel = patientImages.find((i) => i.id === e.target.value);
                  if (sel) setImgLeft(sel);
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs outline-none focus:border-brand-blue"
              >
                {patientImages.map((img) => (
                  <option key={img.id} value={img.id}>
                    {IMAGE_TYPE_AR[img.type] || img.type}
                    {img.tooth_number ? ` (سن #${img.tooth_number})` : ''} -{' '}
                    {formatDateAr(img.taken_at)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold text-xs">الصورة 2 (بعد):</span>
              <select
                value={imgRight?.id || ''}
                onChange={(e) => {
                  const sel = patientImages.find((i) => i.id === e.target.value);
                  if (sel) setImgRight(sel);
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs outline-none focus:border-brand-blue"
              >
                {patientImages.map((img) => (
                  <option key={img.id} value={img.id}>
                    {IMAGE_TYPE_AR[img.type] || img.type}
                    {img.tooth_number ? ` (سن #${img.tooth_number})` : ''} -{' '}
                    {formatDateAr(img.taken_at)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(1)))}
                className="p-1 text-slate-300 hover:text-white"
                title="تكبير"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] text-slate-300">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))}
                className="p-1 text-slate-300 hover:text-white"
                title="تصغير"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setInvert(!invert)}
              className={`p-1.5 rounded-lg border text-xs ${
                invert ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="عكس الألوان (سلبية X-Ray)"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setBrightness(100);
                setContrast(100);
                setInvert(false);
                setSliderPos(50);
              }}
              className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            >
              استعادة
            </button>
          </div>
        </div>

        {/* Comparison Canvas Area */}
        <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center p-3">
          {!imgRight ? (
            <div className="text-center p-8 text-slate-400">
              <p>يرجى اختيار صورة ثانية للمقارنة من القائمة أعلاه</p>
            </div>
          ) : mode === 'slider' ? (
            /* ================= MODE 1: SPLIT SLIDER ================= */
            <div
              ref={sliderContainerRef}
              className="relative w-full h-full max-h-[78vh] flex items-center justify-center overflow-hidden cursor-ew-resize select-none"
              onMouseDown={handleMouseDownSlider}
            >
              {/* Underlying Image 2 (After / Right) */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: `scale(${zoom})`,
                  filter: filterStyle,
                }}
              >
                <img
                  src={urlRight || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80'}
                  alt="After"
                  className="max-h-full max-w-full object-contain"
                  draggable={false}
                />
              </div>

              {/* Overlaid Clipped Image 1 (Before / Left) */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
                style={{
                  clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
                  transform: `scale(${zoom})`,
                  filter: filterStyle,
                }}
              >
                <img
                  src={urlLeft || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80'}
                  alt="Before"
                  className="max-h-full max-w-full object-contain"
                  draggable={false}
                />
              </div>

              {/* Draggable Divider Handle Line */}
              <div
                className="absolute top-0 bottom-0 z-30 flex items-center justify-center pointer-events-none"
                style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-0.5 h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]" />
                <div className="absolute w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center cursor-ew-resize border-2 border-brand-blue pointer-events-auto">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Badges for Before / After */}
              <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <span className="px-3 py-1 rounded-md bg-amber-500/90 text-slate-950 font-bold text-xs shadow-md">
                  قبل العلاج: {formatDateAr(imgLeft.taken_at)}
                </span>
              </div>
              <div className="absolute top-4 right-4 z-20 pointer-events-none">
                <span className="px-3 py-1 rounded-md bg-emerald-500/90 text-slate-950 font-bold text-xs shadow-md">
                  بعد العلاج: {formatDateAr(imgRight.taken_at)}
                </span>
              </div>
            </div>
          ) : (
            /* ================= MODE 2: SIDE BY SIDE ================= */
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
              {/* Left Panel */}
              <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col">
                <div className="p-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-amber-400 font-bold">
                    قبل العلاج • {IMAGE_TYPE_AR[imgLeft.type] || imgLeft.type}
                  </span>
                  <span className="text-slate-400 font-mono">{formatDateAr(imgLeft.taken_at)}</span>
                </div>
                <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
                  <img
                    src={urlLeft || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80'}
                    alt="Left"
                    className="max-h-full max-w-full object-contain"
                    style={{
                      transform: `scale(${zoom})`,
                      filter: filterStyle,
                    }}
                    draggable={false}
                  />
                </div>
                {imgLeft.notes && (
                  <div className="p-2 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 truncate">
                    {imgLeft.notes}
                  </div>
                )}
              </div>

              {/* Right Panel */}
              <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col">
                <div className="p-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold">
                    بعد العلاج • {IMAGE_TYPE_AR[imgRight.type] || imgRight.type}
                  </span>
                  <span className="text-slate-400 font-mono">{formatDateAr(imgRight.taken_at)}</span>
                </div>
                <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
                  <img
                    src={urlRight || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80'}
                    alt="Right"
                    className="max-h-full max-w-full object-contain"
                    style={{
                      transform: `scale(${zoom})`,
                      filter: filterStyle,
                    }}
                    draggable={false}
                  />
                </div>
                {imgRight.notes && (
                  <div className="p-2 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 truncate">
                    {imgRight.notes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>
            {mode === 'slider'
              ? 'اسحب الدائرة البيضاء في المنتصف للتحكم بالمقارنة بين قبل وبعد العلاج'
              : 'عرض جانبي مقارن بدقة تفصيلية متزامنة'}
          </span>
          <span className="text-[11px] text-slate-500">نظام عيادتي للأشعة والمقارنة السريرية</span>
        </div>
      </div>
    </div>
  );
};
