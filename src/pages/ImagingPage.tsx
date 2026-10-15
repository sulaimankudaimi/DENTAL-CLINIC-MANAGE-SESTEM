import React, { useState, useMemo } from 'react';
import type { Image, Patient } from '@shared/contracts';
import { IMAGE_TYPES, IMAGE_TYPE_AR } from '@shared/contracts';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/components/ui/Toast';
import {
  Upload,
  Camera,
  Filter,
  SplitSquareVertical,
  Search,
  User,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MedicalImageCard } from '@/features/imaging/components/MedicalImageCard';
import { MedicalImageViewerModal } from '@/features/imaging/components/MedicalImageViewerModal';
import { MedicalImageComparisonModal } from '@/features/imaging/components/MedicalImageComparisonModal';
import { MedicalImageUploadModal } from '@/features/imaging/components/MedicalImageUploadModal';
import { COMMON_DENTAL_TAGS } from '@/features/imaging/types';

export const ImagingPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 1. Fetch Patients
  const { data: patientsResult } = useQuery({
    queryKey: queryKeys.patients.all,
    queryFn: () => api.patients.list({ page: 1, limit: 100, sort_order: 'desc' }),
  });
  const patients: Patient[] = patientsResult?.ok ? patientsResult.data.items : [];

  // 2. Fetch Images
  const { data: imagesResult, isLoading } = useQuery({
    queryKey: queryKeys.images.all,
    queryFn: () => api.images.list({ page: 1, limit: 150, sort_order: 'desc' }),
  });
  const allImages: Image[] = imagesResult?.ok ? imagesResult.data.items : [];

  // Active Filters
  const [selectedPatientId, setSelectedPatientId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTooth, setFilterTooth] = useState<string>('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedViewerImage, setSelectedViewerImage] = useState<Image | null>(null);
  const [comparisonBaseImage, setComparisonBaseImage] = useState<Image | null>(null);
  const [comparisonTargetImage, setComparisonTargetImage] = useState<Image | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadPatientTarget, setUploadPatientTarget] = useState<string>(patients[0]?.id || '');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  // Filtered images list
  const filteredImages = useMemo(() => {
    return allImages.filter((img) => {
      if (selectedPatientId !== 'all' && img.patient_id !== selectedPatientId) return false;
      if (filterType !== 'all' && img.type !== filterType) return false;
      if (filterTooth && String(img.tooth_number) !== filterTooth.trim()) return false;
      if (filterTag !== 'all' && (!img.tags || !img.tags.includes(filterTag))) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const p = patients.find((pat) => pat.id === img.patient_id);
        const pName = p ? `${p.first_name} ${p.family_name}`.toLowerCase() : '';
        const matchNotes = img.notes?.toLowerCase().includes(q);
        const matchType = (IMAGE_TYPE_AR[img.type] || '').toLowerCase().includes(q);
        const matchPatient = pName.includes(q);
        const matchTags = img.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchNotes && !matchType && !matchPatient && !matchTags) return false;
      }
      return true;
    });
  }, [allImages, selectedPatientId, filterType, filterTooth, filterTag, searchQuery, patients]);

  // Statistics
  const stats = useMemo(() => {
    const total = allImages.length;
    const panoramic = allImages.filter((i) => i.type === 'panoramic').length;
    const periapical = allImages.filter((i) => i.type === 'periapical' || i.type === 'bitewing').length;
    const intraoral = allImages.filter((i) => i.type === 'intraoral_photo').length;
    return { total, panoramic, periapical, intraoral };
  }, [allImages]);

  // Toggle selection for comparison
  const handleToggleSelectCompare = (img: Image) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(img.id)) {
        return prev.filter((id) => id !== img.id);
      }
      if (prev.length >= 2) {
        return [prev[1], img.id];
      }
      return [...prev, img.id];
    });
  };

  const handleLaunchComparison = (baseImg?: Image) => {
    const base = baseImg || allImages.find((i) => i.id === selectedForCompare[0]) || allImages[0] || null;
    const target =
      allImages.find((i) => i.id === selectedForCompare[1]) ||
      allImages.find((i) => i.id !== base?.id && i.patient_id === base?.patient_id) ||
      allImages.find((i) => i.id !== base?.id) ||
      null;

    if (!base) {
      toast({
        title: 'لا توجد صور كافية للمقارنة',
        variant: 'warning',
      });
      return;
    }

    setComparisonBaseImage(base);
    setComparisonTargetImage(target);
    setIsComparisonOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await api.images.delete(deleteConfirmId);
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.images.all });
        toast({
          title: 'تم أرشفة صورة الأشعة',
          description: 'تم إخفاء الصورة مع الاحتفاظ الآمن بملفاتها في الأرشيف الطبي.',
          variant: 'success',
        });
      }
    } catch {
      toast({
        title: 'حدث خطأ أثناء أرشفة الصورة',
        variant: 'danger',
      });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Find patient name for viewer
  const activeViewerPatient = useMemo(() => {
    if (!selectedViewerImage) return undefined;
    const p = patients.find((pat) => pat.id === selectedViewerImage.patient_id);
    return p ? `${p.first_name} ${p.family_name}` : undefined;
  }, [selectedViewerImage, patients]);

  // Images for current active viewer patient
  const patientImagesForViewer = useMemo(() => {
    if (!selectedViewerImage) return allImages;
    return allImages.filter((i) => i.patient_id === selectedViewerImage.patient_id);
  }, [selectedViewerImage, allImages]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="الأشعة والصور الطبية"
        description="أرشيف مركزي للأشعة السينية البانورامية والذروية وصور الكاميرا الفموية مع أدوات القياس والمقارنة السريرية"
        actions={
          <div className="flex items-center gap-2.5">
            {allImages.length >= 2 && (
              <Button
                variant="outline"
                size="md"
                onClick={() => handleLaunchComparison()}
                icon={<SplitSquareVertical className="w-4 h-4 text-brand-blue" />}
              >
                مقارنة صورتين {selectedForCompare.length === 2 && `(محدد 2)`}
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setUploadPatientTarget(
                  selectedPatientId !== 'all' ? selectedPatientId : patients[0]?.id || ''
                );
                setIsUploadModalOpen(true);
              }}
              icon={<Upload className="w-4 h-4" />}
              className="bg-brand-blue hover:bg-blue-600 text-white font-bold"
            >
              رفع صورة أشعة
            </Button>
          </div>
        }
      />

      {/* Top Clinical Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block mb-1">إجمالي الأرشيف</span>
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block mb-1">أشعة بانورامية</span>
            <span className="text-2xl font-bold text-slate-900">{stats.panoramic}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block mb-1">أشعة ذروية وإطباقية</span>
            <span className="text-2xl font-bold text-slate-900">{stats.periapical}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block mb-1">صور سريرية فموية</span>
            <span className="text-2xl font-bold text-slate-900">{stats.intraoral}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          {/* Patient Selector */}
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 outline-none focus:border-brand-blue"
            >
              <option value="all">كافة المرضى ({patients.length})</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.family_name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 outline-none focus:border-brand-blue"
            >
              <option value="all">كافة أنواع الأشعة</option>
              {IMAGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {IMAGE_TYPE_AR[t]}
                </option>
              ))}
            </select>
          </div>

          {/* Tooth filter */}
          <input
            type="number"
            min="1"
            max="48"
            placeholder="رقم السن..."
            value={filterTooth}
            onChange={(e) => setFilterTooth(e.target.value)}
            className="w-24 rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 outline-none focus:border-brand-blue"
          />

          {/* Tag filter */}
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 outline-none focus:border-brand-blue"
          >
            <option value="all">كافة الوسوم</option>
            {COMMON_DENTAL_TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Search by Notes */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث باسم المريض أو الملاحظة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-blue outline-none"
            />
          </div>
        </div>

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

      {/* 3 Columns Gallery Grid (3 أعمدة) */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">جاري تحميل صور الأشعة...</div>
      ) : filteredImages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-brand-blue mx-auto flex items-center justify-center">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800">لا توجد صور أشعة مطابقة للبحث</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              قم برفع صور جديدة أو تغيير معايير البحث لعرض الصور السريرية.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setUploadPatientTarget(
                selectedPatientId !== 'all' ? selectedPatientId : patients[0]?.id || ''
              );
              setIsUploadModalOpen(true);
            }}
            icon={<Upload className="w-4 h-4" />}
            className="bg-brand-blue hover:bg-blue-600 text-white font-bold"
          >
            رفع صورة جديدة
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
          patientName={activeViewerPatient}
          allPatientImages={patientImagesForViewer}
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
          patientImages={
            comparisonBaseImage
              ? allImages.filter((i) => i.patient_id === comparisonBaseImage.patient_id)
              : allImages
          }
          patientName={
            patients.find((p) => p.id === comparisonBaseImage?.patient_id)
              ? `${patients.find((p) => p.id === comparisonBaseImage?.patient_id)?.first_name} ${
                  patients.find((p) => p.id === comparisonBaseImage?.patient_id)?.family_name
                }`
              : undefined
          }
        />
      )}

      {/* Upload Drag & Drop Modal */}
      {isUploadModalOpen && (
        <MedicalImageUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          patientId={uploadPatientTarget || patients[0]?.id || 'p-001'}
          patientName={
            patients.find((p) => p.id === (uploadPatientTarget || patients[0]?.id))
              ? `${patients.find((p) => p.id === (uploadPatientTarget || patients[0]?.id))?.first_name} ${
                  patients.find((p) => p.id === (uploadPatientTarget || patients[0]?.id))?.family_name
                }`
              : undefined
          }
          onSuccess={() => {
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
        description="هل أنت متأكد من حذف هذه الصورة من السجل النشط؟ سيتم أرشفة الملف بأمان في النظام دون حذفه نهائياً من مساحة التخزين."
        confirmText="تأكيد الأرشفة"
        cancelText="إلغاء"
        tone="danger"
      />
    </div>
  );
};

export default ImagingPage;
