import React, { useState, useRef } from 'react';
import type { ImageType, Image } from '@shared/contracts';
import { IMAGE_TYPES, IMAGE_TYPE_AR } from '@shared/contracts';
import { processAndCompressImage } from '@/lib/mediaStorage';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  Upload,
  CheckCircle2,
  Trash2,
  Sparkles,
  Layers,
  Plus,
} from 'lucide-react';
import { COMMON_DENTAL_TAGS } from '../types';

export interface UploadQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  filePath: string;
  thumbnailPath: string;
  type: ImageType;
  toothNumber: number | null;
  takenAt: string; // YYYY-MM-DD
  notes: string;
  tags: string[];
  isCompressing: boolean;
  error?: string;
}

interface MedicalImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName?: string;
  onSuccess?: (createdImages: Image[]) => void;
}

export const MedicalImageUploadModal: React.FC<MedicalImageUploadModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Batch defaults
  const [batchType, setBatchType] = useState<ImageType>('panoramic');
  const [batchDate, setBatchDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [newTagInput, setNewTagInput] = useState<{ [itemId: string]: string }>({});

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) =>
        f.type.startsWith('image/') ||
        f.name.endsWith('.dcm') ||
        f.name.endsWith('.tif') ||
        f.name.endsWith('.tiff')
    );

    if (fileArray.length === 0) {
      toast({
        title: 'الملفات غير مدعومة',
        description: 'يرجى اختيار ملفات صور (JPEG, PNG, WebP, DICOM)',
        variant: 'danger',
      });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    for (const file of fileArray) {
      const tempId = crypto.randomUUID();
      const localPreview = URL.createObjectURL(file);

      // Guess type from filename
      let guessedType: ImageType = batchType;
      const lower = file.name.toLowerCase();
      if (lower.includes('pano')) guessedType = 'panoramic';
      else if (lower.includes('pa') || lower.includes('peri')) guessedType = 'periapical';
      else if (lower.includes('bite')) guessedType = 'bitewing';
      else if (lower.includes('ceph')) guessedType = 'cephalometric';
      else if (lower.includes('cbct')) guessedType = 'cbct';
      else if (lower.includes('intra')) guessedType = 'intraoral_photo';
      else if (lower.includes('extra') || lower.includes('face')) guessedType = 'extraoral_photo';

      const initialItem: UploadQueueItem = {
        id: tempId,
        file,
        previewUrl: localPreview,
        originalSize: file.size,
        compressedSize: 0,
        filePath: '',
        thumbnailPath: '',
        type: guessedType,
        toothNumber: null,
        takenAt: todayStr,
        notes: '',
        tags: [],
        isCompressing: true,
      };

      setQueue((prev) => [...prev, initialItem]);

      // Execute client-side compression & thumbnail generation
      processAndCompressImage(file, patientId)
        .then((res) => {
          setQueue((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? {
                    ...item,
                    filePath: res.filePath,
                    thumbnailPath: res.thumbnailPath,
                    compressedSize: res.compressedSize,
                    isCompressing: false,
                  }
                : item
            )
          );
        })
        .catch((err) => {
          console.error('Compression failed:', err);
          setQueue((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? {
                    ...item,
                    error: 'فشل ضغط الصورة',
                    isCompressing: false,
                  }
                : item
            )
          );
        });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<UploadQueueItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleToggleTag = (itemId: string, tag: string) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.tags.includes(tag);
        const tags = exists
          ? item.tags.filter((t) => t !== tag)
          : [...item.tags, tag];
        return { ...item, tags };
      })
    );
  };

  const handleAddCustomTag = (itemId: string) => {
    const val = (newTagInput[itemId] || '').trim();
    if (!val) return;
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (item.tags.includes(val)) return item;
        return { ...item, tags: [...item.tags, val] };
      })
    );
    setNewTagInput((prev) => ({ ...prev, [itemId]: '' }));
  };

  // Batch apply type or date to all items in queue
  const handleApplyBatchType = () => {
    setQueue((prev) => prev.map((item) => ({ ...item, type: batchType })));
    toast({
      title: 'تم تطبيق النوع على جميع الصور',
      variant: 'info',
    });
  };

  const handleApplyBatchDate = () => {
    setQueue((prev) => prev.map((item) => ({ ...item, takenAt: batchDate })));
    toast({
      title: 'تم تطبيق التاريخ على جميع الصور',
      variant: 'info',
    });
  };

  // Submit all items
  const handleSubmit = async () => {
    if (queue.length === 0) return;

    // Check if any still compressing
    if (queue.some((i) => i.isCompressing)) {
      toast({
        title: 'جاري استكمال ضغط الصور',
        description: 'يرجى الانتظار بضع ثوانٍ حتى يكتمل ضغط وتجهيز المصغرات.',
        variant: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    const createdList: Image[] = [];

    try {
      for (const item of queue) {
        if (item.error) continue;

        // Path is saved in DB, NOT base64!
        const res = await api.images.create({
          clinic_id: 'c1000000-0000-0000-0000-000000000001',
          patient_id: patientId,
          type: item.type,
          tooth_number: item.toothNumber,
          file_path: item.filePath,
          thumbnail_path: item.thumbnailPath,
          taken_at: new Date(item.takenAt).toISOString(),
          captured_by: 'u1000000-0000-0000-0000-000000000001',
          notes: item.notes.trim() || null,
          tags: item.tags,
        });

        if (res.ok) {
          createdList.push(res.data);
        }
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['images', patientId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.images.all });

      toast({
        title: 'تم حفظ الصور والأشعة بنجاح',
        description: `تم حفظ ${createdList.length} صورة في أرشيف المريض (userData/media/${patientId}/) دون تخزين base64.`,
        variant: 'success',
      });

      setQueue([]);
      if (onSuccess) onSuccess(createdList);
      onClose();
    } catch (err) {
      console.error('Save images failed:', err);
      toast({
        title: 'حدث خطأ أثناء الحفظ',
        description: 'تعذر حفظ بعض ملفات الصور، يرجى المحاولة مرة أخرى.',
        variant: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="رفع أشعة وصور طبية جديدة"
      description={`المريض: ${patientName || patientId} • التخزين التلقائي في مجلد المريض مع الضغط الفوري وتوليد المصغرات`}
      size="xl"
    >
      <div className="space-y-5">
        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-brand-blue bg-blue-50/70 scale-[1.01]'
              : 'border-slate-300 hover:border-brand-blue bg-slate-50/60 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.dcm,.tif,.tiff"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
              }
            }}
          />

          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-100 text-brand-blue flex items-center justify-center shadow-xs">
            <Upload className="w-7 h-7" />
          </div>

          <h3 className="text-sm font-bold text-slate-800 mb-1">
            اسحب الصور وأفلتها هنا، أو اضغط للاختيار من الجهاز
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-3">
            يدعم الرفع المتعدد لأشعة البانوراما، الذروية، أجنحة الإطباق، وصور الكاميرا الفموية (JPG, PNG, WebP, DICOM).
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>ضغط تلقائي عالي الدقة وتوليد مصغرات فورية (تخزين مسار فقط بدون base64)</span>
          </div>
        </div>

        {/* Batch Defaults Toolbar */}
        {queue.length > 1 && (
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-blue" />
              تطبيق خصائص موحدة على كافة الصور ({queue.length}):
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <select
                  value={batchType}
                  onChange={(e) => setBatchType(e.target.value as ImageType)}
                  className="rounded-md border border-slate-300 py-1 px-2 bg-white text-slate-700"
                >
                  {IMAGE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {IMAGE_TYPE_AR[t]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleApplyBatchType}
                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-800 font-medium"
                >
                  تطبيق النوع
                </button>
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={batchDate}
                  onChange={(e) => setBatchDate(e.target.value)}
                  className="rounded-md border border-slate-300 py-1 px-2 bg-white text-slate-700"
                />
                <button
                  type="button"
                  onClick={handleApplyBatchDate}
                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-800 font-medium"
                >
                  تطبيق التاريخ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Queue Item Cards */}
        {queue.length > 0 && (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {queue.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-start"
              >
                {/* Thumbnail Preview & Compression Info */}
                <div className="w-full md:w-44 shrink-0 flex flex-col items-center">
                  <div className="w-full aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center relative">
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                    {item.isCompressing ? (
                      <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center text-white text-[11px] gap-1">
                        <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                        <span>جاري الضغط...</span>
                      </div>
                    ) : (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px]">
                        جاهزة
                      </span>
                    )}
                  </div>

                  {/* Size info badge */}
                  <div className="mt-2 text-[11px] text-center text-slate-500 font-mono">
                    <span>{formatFileSize(item.originalSize)}</span>
                    {item.compressedSize > 0 && (
                      <span className="text-emerald-600 font-semibold block">
                        ➔ {formatFileSize(item.compressedSize)} (وفر{' '}
                        {Math.round(
                          ((item.originalSize - item.compressedSize) /
                            item.originalSize) *
                            100
                        )}
                        %)
                      </span>
                    )}
                  </div>
                </div>

                {/* Form Fields for this image */}
                <div className="flex-1 w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs truncate max-w-[280px]">
                      #{idx + 1} - {item.file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="حذف من قائمة الرفع"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Classification Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {/* Image Type */}
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        نوع الصورة / الأشعة
                      </label>
                      <select
                        value={item.type}
                        onChange={(e) =>
                          handleUpdateItem(item.id, {
                            type: e.target.value as ImageType,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 py-1.5 px-2 bg-white text-slate-700 outline-none focus:border-brand-blue"
                      >
                        {IMAGE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {IMAGE_TYPE_AR[t]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Associated Tooth */}
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        السن المرتبط (اختياري)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="48"
                        placeholder="مثال: 14 أو 21"
                        value={item.toothNumber || ''}
                        onChange={(e) =>
                          handleUpdateItem(item.id, {
                            toothNumber: e.target.value
                              ? parseInt(e.target.value, 10)
                              : null,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 outline-none focus:border-brand-blue"
                      />
                    </div>

                    {/* Date Taken */}
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        تاريخ الالتقاط
                      </label>
                      <input
                        type="date"
                        value={item.takenAt}
                        onChange={(e) =>
                          handleUpdateItem(item.id, { takenAt: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 outline-none focus:border-brand-blue"
                      />
                    </div>
                  </div>

                  {/* Tags Selection */}
                  <div>
                    <label className="block text-slate-600 font-medium mb-1.5 text-xs">
                      الوسوم والتصنيف السريري
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {COMMON_DENTAL_TAGS.slice(0, 6).map((t) => {
                        const isSelected = item.tags.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleToggleTag(item.id, t)}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                              isSelected
                                ? 'bg-brand-blue text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}

                      {/* Custom tag input */}
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="وسم مخصص..."
                          value={newTagInput[item.id] || ''}
                          onChange={(e) =>
                            setNewTagInput({
                              ...newTagInput,
                              [item.id]: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomTag(item.id);
                            }
                          }}
                          className="w-24 px-2 py-0.5 text-[11px] rounded border border-slate-300 bg-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomTag(item.id)}
                          className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Notes */}
                  <div>
                    <input
                      type="text"
                      placeholder="ملاحظات تشخيصية (مثال: نخر عميق ملامس للعصب، سن مطمور مائل)..."
                      value={item.notes}
                      onChange={(e) =>
                        handleUpdateItem(item.id, { notes: e.target.value })
                      }
                      className="w-full text-xs rounded-lg border border-slate-200 py-1.5 px-3 bg-slate-50 focus:bg-white focus:border-brand-blue outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {queue.length > 0
              ? `إجمالي الصور المحددة للرفع: ${queue.length}`
              : 'لم يتم اختيار ملفات بعد'}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={queue.length === 0 || isSubmitting}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {isSubmitting ? 'جاري الحفظ والتخزين...' : `حفظ وتخزين ${queue.length} صورة`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
