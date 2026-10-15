import React, { useState, useMemo } from 'react';
import type { Image } from '@shared/contracts';
import { IMAGE_TYPES, IMAGE_TYPE_AR } from '@shared/contracts';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/components/ui/Toast';
import {
  Camera,
  Plus,
  Filter,
  SplitSquareVertical,
  Search,
} from 'lucide-react';
import { MedicalImageCard } from '@/features/imaging/components/MedicalImageCard';
import { MedicalImageViewerModal } from '@/features/imaging/components/MedicalImageViewerModal';
import { MedicalImageComparisonModal } from '@/features/imaging/components/MedicalImageComparisonModal';
import { MedicalImageUploadModal } from '@/features/imaging/components/MedicalImageUploadModal';
import { COMMON_DENTAL_TAGS } from '@/features/imaging/types';

export interface PatientImagingTabProps {
  images: Image[];
  patientId: string;
  patientName?: string;
  onUploadImage?: () => void;
  onDeleteImage?: (id: string) => void;
}

export const PatientImagingTab: React.FC<PatientImagingTabProps> = ({
  images,
  patientId,
  patientName,
  onUploadImage: externalUploadHandler,
  onDeleteImage: externalDeleteHandler,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Modals state
  const [selectedViewerImage, setSelectedViewerImage] = useState<Image | null>(null);
  const [comparisonBaseImage, setComparisonBaseImage] = useState<Image | null>(null);
  const [comparisonTargetImage, setComparisonTargetImage] = useState<Image | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Multi-selection for comparison
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  // Filter & Search states
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTooth, setFilterTooth] = useState<string>('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract all existing tags across images
  const allTags = useMemo(() => {
    const set = new Set<string>(COMMON_DENTAL_TAGS);
    images.forEach((img) => {
      if (Array.isArray(img.tags)) {
        img.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [images]);

  // Filtered images
  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      if (filterType !== 'all' && img.type !== filterType) return false;
      if (filterTooth && String(img.tooth_number) !== filterTooth.trim()) return false;
      if (filterTag !== 'all' && (!img.tags || !img.tags.includes(filterTag))) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNotes = img.notes?.toLowerCase().includes(q);
        const matchType = (IMAGE_TYPE_AR[img.type] || '').toLowerCase().includes(q);
        const matchTags = img.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchNotes && !matchType && !matchTags) return false;
      }
      return true;
    });
  }, [images, filterType, filterTooth, filterTag, searchQuery]);

  // Toggle selection for comparison
  const handleToggleSelectCompare = (img: Image) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(img.id)) {
        return prev.filter((id) => id !== img.id);
      }
      if (prev.length >= 2) {
        // Keep the second one and add the new one
        return [prev[1], img.id];
      }
      return [...prev, img.id];
    });
  };

  // Launch comparison modal with 2 selected images
  const handleLaunchComparison = (baseImg?: Image, targetImg?: Image) => {
    const base = baseImg || images.find((i) => i.id === selectedForCompare[0]) || images[0] || null;
    const target =
      targetImg ||
      images.find((i) => i.id === selectedForCompare[1]) ||
      images.find((i) => i.id !== base?.id) ||
      null;

    if (!base) {
      toast({
        title: 'لا توجد صور كافية للمقارنة',
        description: 'يرجى رفع صورتين على الأقل للتمكن من المقارنة.',
        variant: 'warning',
      });
      return;
    }

    setComparisonBaseImage(base);
    setComparisonTargetImage(target);
    setIsComparisonOpen(true);
  };

  // Delete image action (soft delete in DB)
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;

    if (externalDeleteHandler) {
      externalDeleteHandler(deleteConfirmId);
      setDeleteConfirmId(null);
      return;
    }

    try {
      const res = await api.images.delete(deleteConfirmId);
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['images', patientId] });
        queryClient.invalidateQueries({ queryKey: queryKeys.images.all });
        toast({
          title: 'تم أرشفة الصورة',
          description: 'تم إخفاء الصورة من السجل السريري مع الاحتفاظ بملفها في الأرشيف الآمن.',
          variant: 'success',
        });
      }
    } catch {
      toast({
        title: 'حدث خطأ أثناء حذف الصورة',
        variant: 'danger',
      });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleOpenUpload = () => {
    if (externalUploadHandler) {
      // If external handler is custom, but we want our full upload modal:
      setIsUploadModalOpen(true);
    } else {
      setIsUploadModalOpen(true);
    }
  };

  return (
    <div id="patient-imaging-tab" className="space-y-6">
      {/* Top Bar with Counter, Actions, and Primary Blue Upload Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand-navy" />
            معرض الأشعة والصور السريرية
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              {images.length} صور
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            أرشيف رقمي عالي الدقة: أشعة بانورامية، ذروية (PA)، إطباقية، وصور الكاميرا الفموية مع أدوات القياس والمقارنة
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Compare Button */}
          {images.length >= 2 && (
            <Button
              variant="outline"
              size="md"
              onClick={() => handleLaunchComparison()}
              icon={<SplitSquareVertical className="w-4 h-4 text-brand-blue" />}
              className="text-xs"
            >
              مقارنة صورتين {selectedForCompare.length === 2 && `(محدد 2)`}
            </Button>
          )}

          {/* Blue "إضافة صورة جديدة" Button matching prompt */}
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenUpload}
            icon={<Plus className="w-4 h-4" />}
            className="text-xs bg-brand-blue hover:bg-blue-600 text-white shadow-sm font-bold"
          >
            إضافة صورة جديدة
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          {/* Search by Notes */}
          <div className="relative min-w-[180px] max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في الملاحظات أو الوسوم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-blue outline-none"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 outline-none focus:border-brand-blue"
            >
              <option value="all">كافة الأنواع</option>
              {IMAGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {IMAGE_TYPE_AR[t]}
                </option>
              ))}
            </select>
          </div>

          {/* Tooth filter */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max="48"
              placeholder="رقم السن..."
              value={filterTooth}
              onChange={(e) => setFilterTooth(e.target.value)}
              className="w-24 rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 outline-none focus:border-brand-blue"
            />
          </div>

          {/* Tag filter */}
          <div className="flex items-center gap-1">
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 outline-none focus:border-brand-blue"
            >
              <option value="all">كافة الوسوم</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected count info */}
        {selectedForCompare.length > 0 && (
          <div className="flex items-center gap-2 text-slate-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
            <span>محدد للمقارنة: {selectedForCompare.length} من 2</span>
            <button
              type="button"
              onClick={() => setSelectedForCompare([])}
              className="text-brand-blue hover:underline"
            >
              إلغاء التحديد
            </button>
          </div>
        )}
      </div>

      {/* 3 Columns Gallery Grid (طابق المعيار: 3 أعمدة) */}
      {filteredImages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-brand-blue mx-auto flex items-center justify-center">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800">لا توجد صور أو أشعة تطابق البحث</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              قم برفع صور أشعة جديدة (بانوراما، ذروية، أجنحة إطباق) لتتبع الخطة العلاجية والتشخيص الدقيق.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenUpload}
            icon={<Plus className="w-4 h-4" />}
            className="bg-brand-blue hover:bg-blue-600 text-white font-bold"
          >
            إضافة صورة جديدة
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredImages.map((img) => (
            <MedicalImageCard
              key={img.id}
              image={img}
              isSelectedForCompare={selectedForCompare.includes(img.id)}
              onToggleSelectCompare={handleToggleSelectCompare}
              onOpenViewer={(item) => setSelectedViewerImage(item)}
              onOpenCompare={(item) => handleLaunchComparison(item)}
              onDelete={(id) => setDeleteConfirmId(id)}
            />
          ))}
        </div>
      )}

      {/* Advanced Viewer Modal */}
      {selectedViewerImage && (
        <MedicalImageViewerModal
          image={selectedViewerImage}
          patientName={patientName}
          allPatientImages={images}
          isOpen={!!selectedViewerImage}
          onClose={() => setSelectedViewerImage(null)}
          onOpenComparison={(base) => {
            setSelectedViewerImage(null);
            handleLaunchComparison(base);
          }}
        />
      )}

      {/* Comparison Modal */}
      {isComparisonOpen && comparisonBaseImage && (
        <MedicalImageComparisonModal
          isOpen={isComparisonOpen}
          onClose={() => setIsComparisonOpen(false)}
          baseImage={comparisonBaseImage}
          targetImage={comparisonTargetImage}
          patientImages={images}
          patientName={patientName}
        />
      )}

      {/* Upload Drag & Drop Modal */}
      {isUploadModalOpen && (
        <MedicalImageUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          patientId={patientId}
          patientName={patientName}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['images', patientId] });
            queryClient.invalidateQueries({ queryKey: queryKeys.images.all });
          }}
        />
      )}

      {/* Delete / Archive Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
        title="أرشفة صورة الأشعة"
        description="هل أنت متأكد من حذف هذه الصورة من السجل النشط للمريض؟ سيتم أرشفة الملف بأمان في النظام دون حذفه نهائياً من مساحة التخزين."
        confirmText="تأكيد الأرشفة"
        cancelText="إلغاء"
        tone="danger"
      />
    </div>
  );
};

export default PatientImagingTab;
