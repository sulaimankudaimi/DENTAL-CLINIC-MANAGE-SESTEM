import React from 'react';
import type { Image } from '@shared/contracts';
import { IMAGE_TYPE_AR } from '@shared/contracts';
import { formatDateAr } from '@/lib/formatters';
import { useMediaUrl } from '@/lib/useMediaUrl';
import {
  Maximize2,
  Calendar,
  Trash2,
  SplitSquareVertical,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MedicalImageCardProps {
  image: Image;
  isSelectedForCompare: boolean;
  onToggleSelectCompare: (img: Image) => void;
  onOpenViewer: (img: Image) => void;
  onOpenCompare: (img: Image) => void;
  onDelete?: (id: string) => void;
}

export const MedicalImageCard: React.FC<MedicalImageCardProps> = ({
  image,
  isSelectedForCompare,
  onToggleSelectCompare,
  onOpenViewer,
  onOpenCompare,
  onDelete,
}) => {
  const { url, isLoading } = useMediaUrl(image.thumbnail_path || image.file_path);

  return (
    <div
      className={`group bg-white rounded-xl border transition-all duration-200 overflow-hidden flex flex-col shadow-xs hover:shadow-md ${
        isSelectedForCompare
          ? 'border-brand-blue ring-2 ring-brand-blue/30'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Thumbnail Area */}
      <div
        className="relative aspect-[16/10] bg-slate-900 cursor-pointer overflow-hidden flex items-center justify-center"
        onClick={() => onOpenViewer(image)}
      >
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 text-xs">
            <span className="animate-spin border-2 border-slate-600 border-t-white rounded-full w-5 h-5" />
          </div>
        ) : (
          <img
            src={url || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80'}
            alt={image.notes || 'Dental X-Ray'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <span className="p-2 rounded-full bg-white/90 text-slate-900 hover:bg-white shadow">
            <Maximize2 className="w-4 h-4" />
          </span>
        </div>

        {/* Multi-compare selection checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelectCompare(image);
          }}
          className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
            isSelectedForCompare
              ? 'bg-brand-blue text-white shadow-md'
              : 'bg-black/50 text-white/70 hover:bg-black/70 hover:text-white backdrop-blur-xs'
          }`}
          title={isSelectedForCompare ? 'إلغاء التحديد للمقارنة' : 'تحديد للمقارنة'}
        >
          {isSelectedForCompare && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        {/* Tooth number badge */}
        {image.tooth_number && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-brand-navy/90 text-white font-mono font-bold text-[11px] shadow backdrop-blur-xs">
            سن #{image.tooth_number}
          </span>
        )}

        {/* Type badge overlay */}
        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/75 text-slate-100 text-[10px] backdrop-blur-xs font-medium">
          {IMAGE_TYPE_AR[image.type] || image.type}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="flex items-center gap-1 font-mono">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDateAr(image.taken_at)}
            </span>
          </div>

          {image.notes ? (
            <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed" title={image.notes}>
              {image.notes}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">بدون ملاحظات مسجلة</p>
          )}

          {/* Tags */}
          {image.tags && image.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {image.tags.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenViewer(image)}
              className="text-xs py-1 px-2.5 h-7"
            >
              معاينة
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenCompare(image)}
              className="text-xs py-1 px-2 h-7 text-slate-600 hover:text-brand-blue"
              title="مقارنة هذه الصورة مع أخرى"
            >
              <SplitSquareVertical className="w-3.5 h-3.5 mr-1" />
              مقارنة
            </Button>
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(image.id)}
              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="أرشفة / حذف الصورة"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
