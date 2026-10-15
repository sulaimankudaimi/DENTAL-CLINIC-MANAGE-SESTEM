import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Procedure, CreateProcedure, ProcedureCategory } from '@shared/contracts';
import {
  PROCEDURE_CATEGORIES,
  PROCEDURE_CATEGORY_AR,
} from '@shared/contracts';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import { ProcedureFormDialog } from './components/ProcedureFormDialog';
import { CsvImportModal } from './components/CsvImportModal';
import {
  Stethoscope,
  Plus,
  Search,
  Download,
  Upload,
  Check,
  X,
  Edit2,
  CheckCircle2,
  Clock,
  Sparkles,
  ToggleLeft,
  Layers,
} from 'lucide-react';

export const ProceduresCatalogPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Dialogs state
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Inline editing state: { procId: string, field: 'price' | 'duration', value: number }
  const [inlineEdit, setInlineEdit] = useState<{
    id: string;
    field: 'price' | 'duration';
    value: number;
  } | null>(null);

  // Fetch Procedures
  const { data: proceduresData, isLoading } = useQuery({
    queryKey: queryKeys.treatments.procedures(),
    queryFn: async () => {
      const res = await api.treatments.getProcedures({ page: 1, limit: 300 });
      return res.ok ? res.data.items : [];
    },
  });

  const procedures = proceduresData || [];

  // Mutations
  const updateProcedureMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Procedure> }) => {
      if (api.treatments.updateProcedure) {
        return api.treatments.updateProcedure(id, patch);
      }
      return api.treatments.update(id, patch as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments.procedures() });
      showToast({ title: 'تم التحديث', description: 'تم حفظ تعديل الإجراء بنجاح', variant: 'success' });
      setInlineEdit(null);
    },
    onError: () => {
      showToast({ title: 'خطأ', description: 'فشل حفظ التعديل', variant: 'error' });
    },
  });

  const createProcedureMutation = useMutation({
    mutationFn: async (data: CreateProcedure) => {
      if (api.treatments.createProcedure) {
        return api.treatments.createProcedure(data);
      }
      throw new Error('غير مدعوم');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments.procedures() });
      showToast({ title: 'تم الإضافة', description: 'تمت إضافة الإجراء السريري بنجاح', variant: 'success' });
      setIsFormDialogOpen(false);
    },
    onError: (err) => {
      showToast({ title: 'خطأ', description: err instanceof Error ? err.message : 'فشل إضافة الإجراء', variant: 'error' });
    },
  });

  const bulkUpsertMutation = useMutation({
    mutationFn: async (procs: CreateProcedure[]) => {
      if (api.treatments.bulkUpsertProcedures) {
        return api.treatments.bulkUpsertProcedures(procs);
      }
      throw new Error('غير مدعوم');
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.treatments.procedures() });
      showToast({
        title: 'تم الاستيراد بنجاح',
        description: `تم استيراد وتحديث ${count.ok ? count.data : 0} إجراء في الكتالوج`,
        variant: 'success',
      });
      setIsCsvModalOpen(false);
    },
    onError: () => {
      showToast({ title: 'خطأ', description: 'فشل استيراد الإجراءات', variant: 'error' });
    },
  });

  // Filtered procedures
  const filteredProcedures = useMemo(() => {
    return procedures.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      // Active status filter
      if (activeFilter === 'active' && !p.is_active) return false;
      if (activeFilter === 'inactive' && p.is_active) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesAr = p.name_ar.toLowerCase().includes(q);
        const matchesEn = p.name_en?.toLowerCase().includes(q);
        const matchesCode = p.code.toLowerCase().includes(q);
        if (!matchesAr && !matchesEn && !matchesCode) return false;
      }

      return true;
    });
  }, [procedures, selectedCategory, activeFilter, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: procedures.length };
    for (const p of procedures) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [procedures]);

  // Inline edit handlers
  const handleSaveInline = (id: string) => {
    if (!inlineEdit || inlineEdit.id !== id) return;
    if (inlineEdit.field === 'price') {
      const priceHalalas = Math.max(0, Math.round(inlineEdit.value * 100));
      updateProcedureMutation.mutate({ id, patch: { default_price_halalas: priceHalalas } });
    } else if (inlineEdit.field === 'duration') {
      const durationMin = Math.max(5, Math.round(inlineEdit.value));
      updateProcedureMutation.mutate({ id, patch: { default_duration_min: durationMin } });
    }
  };

  const handleToggleActive = (p: Procedure) => {
    updateProcedureMutation.mutate({
      id: p.id,
      patch: { is_active: !p.is_active },
    });
  };

  // CSV Export
  const handleExportCsv = () => {
    if (procedures.length === 0) return;
    const headers = [
      'code',
      'name_ar',
      'name_en',
      'category',
      'price_sar',
      'duration_min',
      'requires_tooth',
      'requires_surface',
      'is_active',
    ];

    const rows = filteredProcedures.map((p) => [
      `"${p.code}"`,
      `"${p.name_ar.replace(/"/g, '""')}"`,
      `"${(p.name_en || '').replace(/"/g, '""')}"`,
      `"${p.category}"`,
      (p.default_price_halalas / 100).toFixed(2),
      p.default_duration_min,
      p.requires_tooth ? 'true' : 'false',
      p.requires_surface ? 'true' : 'false',
      p.is_active ? 'true' : 'false',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `eyadati_procedures_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      title: 'تم التصدير',
      description: `تم تصدير ${filteredProcedures.length} إجراء بنجاح بصيغة CSV`,
      variant: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-navy flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-[#1E4E9C]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              كتالوج الإجراءات السريرية ودليل الأسعار
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              إدارة أسعار الإجراءات، المدد المعيارية، متطلبات السن والسطح، واستيراد وتصدير CSV
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download className="w-4 h-4" />}
            className="text-xs"
          >
            تصدير CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCsvModalOpen(true)}
            icon={<Upload className="w-4 h-4" />}
            className="text-xs text-slate-700 hover:text-brand-navy"
          >
            استيراد CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingProcedure(null);
              setIsFormDialogOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
            className="text-xs shadow-sm"
          >
            إجراء جديد
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">إجمالي الإجراءات</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{procedures.length}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-brand-navy">
            <Layers className="w-5 h-5 text-[#1E4E9C]" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">الإجراءات المفعلة</span>
            <span className="text-xl font-bold text-emerald-600 mt-0.5 block">
              {procedures.filter((p) => p.is_active).length}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">الإجراءات المعطلة</span>
            <span className="text-xl font-bold text-slate-500 mt-0.5 block">
              {procedures.filter((p) => !p.is_active).length}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-500">
            <ToggleLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">عدد التخصصات</span>
            <span className="text-xl font-bold text-purple-600 mt-0.5 block">
              {Object.keys(categoryCounts).length - 1}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالرمز الكودي (ADA Code) أو اسم الإجراء بالعربية والإنجليزية..."
              className="w-full text-xs pr-9 pl-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Active filter toggles */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold select-none">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({procedures.length})
            </button>
            <button
              onClick={() => setActiveFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              نشط فقط ({procedures.filter((p) => p.is_active).length})
            </button>
            <button
              onClick={() => setActiveFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === 'inactive' ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              معطل فقط ({procedures.filter((p) => !p.is_active).length})
            </button>
          </div>
        </div>

        {/* Categories scrollable pill list */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-brand-navy text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>جميع الفئات</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {categoryCounts.all || 0}
            </span>
          </button>

          {PROCEDURE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-brand-navy text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{PROCEDURE_CATEGORY_AR[cat] || cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table of Procedures with Inline Editing */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" className="text-brand-blue" />
            <span className="text-xs text-slate-500">جاري تحميل كتالوج الإجراءات...</span>
          </div>
        ) : filteredProcedures.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">لم يتم العثور على أي إجراءات مطابقة</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              جرب تغيير معايير البحث أو تصفية الفئات، أو أضف إجراءً جديداً
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="text-xs mt-2"
            >
              إعادة ضبط الفلاتر
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold select-none">
                <tr>
                  <th className="p-3.5 pr-5 w-24">الرمز (Code)</th>
                  <th className="p-3.5 min-w-[220px]">اسم الإجراء السريري</th>
                  <th className="p-3.5">الفئة التخصصية</th>
                  <th className="p-3.5 text-center min-w-[130px]">السعر (ر.س) ✏️</th>
                  <th className="p-3.5 text-center min-w-[110px]">المدة (دقيقة) ✏️</th>
                  <th className="p-3.5 text-center">السن / السطح</th>
                  <th className="p-3.5 text-center w-24">الحالة</th>
                  <th className="p-3.5 text-left pl-5 w-24">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProcedures.map((proc) => {
                  const isEditingPrice = inlineEdit?.id === proc.id && inlineEdit.field === 'price';
                  const isEditingDur = inlineEdit?.id === proc.id && inlineEdit.field === 'duration';

                  return (
                    <tr
                      key={proc.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !proc.is_active ? 'opacity-60 bg-slate-50/40' : ''
                      }`}
                    >
                      {/* Code */}
                      <td className="p-3.5 pr-5 font-mono font-bold text-brand-navy">
                        <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200/60 text-[#1E4E9C]">
                          {proc.code}
                        </span>
                      </td>

                      {/* Name Ar & En */}
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 leading-snug">
                            {proc.name_ar}
                          </span>
                          {proc.name_en && (
                            <span className="text-[11px] text-slate-400 font-sans mt-0.5" dir="ltr">
                              {proc.name_en}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium border-slate-200 bg-white"
                        >
                          {PROCEDURE_CATEGORY_AR[proc.category as ProcedureCategory] || proc.category}
                        </Badge>
                      </td>

                      {/* Default Price with Inline Edit */}
                      <td className="p-3.5 text-center">
                        {isEditingPrice ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              step={10}
                              autoFocus
                              value={inlineEdit.value}
                              onChange={(e) =>
                                setInlineEdit({
                                  id: proc.id,
                                  field: 'price',
                                  value: Number(e.target.value),
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInline(proc.id);
                                if (e.key === 'Escape') setInlineEdit(null);
                              }}
                              className="w-20 text-xs font-bold text-center border border-brand-blue rounded-md px-1.5 py-1 focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveInline(proc.id)}
                              className="p-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              title="حفظ السعر"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setInlineEdit(null)}
                              className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                              title="إلغاء"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setInlineEdit({
                                id: proc.id,
                                field: 'price',
                                value: Math.round(proc.default_price_halalas / 100),
                              })
                            }
                            className="group flex items-center justify-center gap-1.5 mx-auto font-bold text-slate-800 hover:text-brand-navy px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                            title="انقر لتعديل السعر مباشرة"
                          >
                            <span>{(proc.default_price_halalas / 100).toLocaleString('en-US')} ر.س</span>
                            <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-brand-navy transition-colors opacity-0 group-hover:opacity-100" />
                          </button>
                        )}
                      </td>

                      {/* Duration with Inline Edit */}
                      <td className="p-3.5 text-center">
                        {isEditingDur ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min={5}
                              step={5}
                              autoFocus
                              value={inlineEdit.value}
                              onChange={(e) =>
                                setInlineEdit({
                                  id: proc.id,
                                  field: 'duration',
                                  value: Number(e.target.value),
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInline(proc.id);
                                if (e.key === 'Escape') setInlineEdit(null);
                              }}
                              className="w-16 text-xs font-bold text-center border border-brand-blue rounded-md px-1.5 py-1 focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveInline(proc.id)}
                              className="p-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              title="حفظ المدة"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setInlineEdit(null)}
                              className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                              title="إلغاء"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setInlineEdit({
                                id: proc.id,
                                field: 'duration',
                                value: proc.default_duration_min,
                              })
                            }
                            className="group flex items-center justify-center gap-1 mx-auto text-slate-700 hover:text-brand-navy px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                            title="انقر لتعديل المدة مباشرة"
                          >
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{proc.default_duration_min} د</span>
                            <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-brand-navy transition-colors opacity-0 group-hover:opacity-100" />
                          </button>
                        )}
                      </td>

                      {/* Requires Tooth / Surface */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-[11px]">
                          {proc.requires_tooth ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/50">
                              سن
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          {proc.requires_surface && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/50">
                              سطح
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Active Toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleActive(proc)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                            proc.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                          title={proc.is_active ? 'انقر لتعطيل الإجراء' : 'انقر لتفعيل الإجراء'}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              proc.is_active ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          {proc.is_active ? 'نشط' : 'معطل'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-left pl-5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingProcedure(proc);
                            setIsFormDialogOpen(true);
                          }}
                          className="text-xs text-slate-600 hover:text-brand-navy"
                        >
                          تعديل
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer showing count */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            عرض {filteredProcedures.length} من أصل {procedures.length} إجراء
          </span>
          <span className="text-slate-400">
            تلميح: انقر على أي سعر أو مدة لتعديلها فوراً دون فتح نافذة التعديل
          </span>
        </div>
      </div>

      {/* Procedure Create/Edit Dialog */}
      <ProcedureFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => {
          setIsFormDialogOpen(false);
          setEditingProcedure(null);
        }}
        procedure={editingProcedure}
        onSubmit={async (data) => {
          if (editingProcedure) {
            await updateProcedureMutation.mutateAsync({
              id: editingProcedure.id,
              patch: data,
            });
          } else {
            await createProcedureMutation.mutateAsync(data as CreateProcedure);
          }
        }}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImport={async (procs) => {
          const res = await bulkUpsertMutation.mutateAsync(procs);
          return res.ok ? res.data : 0;
        }}
      />
    </div>
  );
};
export default ProceduresCatalogPage;
