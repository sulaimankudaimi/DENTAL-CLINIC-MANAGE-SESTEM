import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InsuranceCompany, InsuranceClaim } from '@shared/contracts';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import {
  Building2,
  Plus,
  Search,
  Percent,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  Trash2,
  Phone,
  Mail,
  User,
  Tag,
} from 'lucide-react';
import { CompanyFormModal } from './components/CompanyFormModal';

interface Props {
  onOpenCreateClaim?: (companyId?: string) => void;
}

export const InsuranceCompaniesPage: React.FC<Props> = ({ onOpenCreateClaim }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<InsuranceCompany | null>(null);

  const { data: companies = [], isLoading } = useQuery<InsuranceCompany[]>({
    queryKey: queryKeys.insurance.companies,
    queryFn: async () => {
      const res = await api.insurance.getCompanies();
      return res.ok ? res.data : [];
    },
  });

  const { data: claims = [] } = useQuery<InsuranceClaim[]>({
    queryKey: queryKeys.insurance.claims(),
    queryFn: async () => {
      const res = await api.insurance.getClaims();
      return res.ok ? res.data : [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!window.confirm('هل أنت متأكد من رغبتك في حذف شركة التأمين هذه؟')) return;
      const res = await api.insurance.deleteCompany(id);
      if (res && !res.ok) throw new Error(res.error || 'فشل حذف الشركة');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.insurance.companies });
    },
  });

  const filteredCompanies = companies.filter((c: InsuranceCompany) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.contact && c.contact.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const handleEdit = (comp: InsuranceCompany) => {
    setEditingCompany(comp);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCompany(null);
    setIsModalOpen(true);
  };

  const formatSAR = (halalas?: number | null) => {
    if (halalas === null || halalas === undefined) return 'غير محدد';
    return `${(halalas / 100).toLocaleString('ar-SA')} ر.س`;
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3.5 top-3 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الشركة، جهة الاتصال، أو الهاتف..."
            className="w-full rounded-xl border border-zinc-200 bg-white pr-10 pl-4 py-2.5 text-xs sm:text-sm text-zinc-900 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" />
          إضافة شركة تأمين
        </button>
      </div>

      {/* Grid of Companies */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-zinc-100 animate-pulse dark:bg-zinc-800" />
          ))}
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
          <Building2 className="mx-auto h-12 w-12 text-zinc-400" />
          <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">
            لا توجد شركات تأمين مطابقة
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {searchTerm ? 'جرب البحث بكلمة أخرى' : 'ابدأ بإضافة أول شركة تأمين معتمدة'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"
            >
              <Plus className="h-4 w-4" />
              إضافة شركة
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map((company: InsuranceCompany) => {
            const companyClaims = claims.filter((c: InsuranceClaim) => c.company_id === company.id);
            const activeClaimsCount = companyClaims.length;

            return (
              <div
                key={company.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg dark:bg-primary/20">
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900 text-sm sm:text-base dark:text-zinc-100 leading-snug">
                          {company.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {company.requires_preapproval ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                              <ShieldAlert className="h-3 w-3" />
                              تتطلب موافقة مسبقة
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              <ShieldCheck className="h-3 w-3" />
                              موافقة مباشرة
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                      <button
                        onClick={() => handleEdit(company)}
                        title="تعديل بيانات الشركة"
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(company.id)}
                        title="حذف الشركة"
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Coverage stats */}
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50 text-xs">
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">
                        نسبة التغطية الافتراضية
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-1 mt-0.5">
                        <Percent className="h-3.5 w-3.5 text-primary" />
                        {company.coverage_percent_default}%
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">
                        سقف التغطية السنوي
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-1 mt-0.5">
                        <Coins className="h-3.5 w-3.5 text-amber-500" />
                        {formatSAR(company.annual_limit_halalas)}
                      </span>
                    </div>
                  </div>

                  {/* Excluded procedures tags */}
                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mb-1.5">
                      <Tag className="h-3 w-3 text-rose-500" />
                      الإجراءات المستثناة ({company.excluded_procedures?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {company.excluded_procedures && company.excluded_procedures.length > 0 ? (
                        company.excluded_procedures.map((proc: string, i: number) => (
                          <span
                            key={i}
                            className="inline-block rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                          >
                            {proc}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic">لا توجد استثناءات</span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {company.contact && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                        <span>{company.contact}</span>
                      </div>
                    )}
                    {company.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-zinc-400" />
                        <span dir="ltr">{company.phone}</span>
                      </div>
                    )}
                    {company.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-zinc-400" />
                        <span>{company.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">
                    {activeClaimsCount} مطالبة مسجلة
                  </span>

                  <button
                    onClick={() => onOpenCreateClaim?.(company.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    مطالبة جديدة
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <CompanyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companyToEdit={editingCompany}
      />
    </div>
  );
};
